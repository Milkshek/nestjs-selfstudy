import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Put,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request as ExpressRequest } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse } from '@nestjs/swagger';
import type { User } from '../users/user.js';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard.js';
import { ArticlesService } from './articles.service.js';
import { CreateArticleDto } from './dto/input/create-article.dto.js';
import { PaginationQueryDto } from './dto/input/pagination-query.dto.js';
import { UpdateArticleDto } from './dto/input/update-article.dto.js';
import { UpdateArticlePublicationDto } from './dto/input/update-article-publication.dto.js';
import { ArticleOutputDto } from './dto/output/article-output.dto.js';
import { PaginatedArticlesOutputDto } from './dto/output/paginated-articles-output.dto.js';
import { ArticleImagesService } from './article-images.service.js';

@Controller('articles')
@ApiTags('Articles')
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly articleImagesService: ArticleImagesService,
  ) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=60')
  @ApiOkResponse({ type: PaginatedArticlesOutputDto })
  async findAll(@Query() query: PaginationQueryDto): Promise<PaginatedArticlesOutputDto> {
    const [articles, total] = await this.articlesService.findAllPublished(
      query.page,
      query.limit,
      query.sortBy,
      query.sortDirection,
      query.search,
      query.category,
      query.tag,
    );

    return PaginatedArticlesOutputDto.hydrate(articles, total, query.page, query.limit);
  }

  @Get('mine')
  @UseGuards(JwtAuthenticationGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: [ArticleOutputDto] })
  async findMine(@Request() request: ExpressRequest & { user: User }): Promise<ArticleOutputDto[]> {
    return (await this.articlesService.findAllByAuthor(request.user))
      .map((article) => ArticleOutputDto.hydrate(article));
  }

  @Get(':id')
  @Header('Cache-Control', 'public, max-age=60')
  @ApiOkResponse({ type: ArticleOutputDto })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ArticleOutputDto> {
    const article = await this.articlesService.findPublished(id);

    if (!article) {
      throw new NotFoundException(`Article ${id} not found`);
    }

    return ArticleOutputDto.hydrate(article);
  }

  @Delete(':id')
  @UseGuards(JwtAuthenticationGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiNoContentResponse()
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() request: ExpressRequest & { user: User },
  ): Promise<void> {
    const article = await this.articlesService.findOneForOwner(id, request.user);
    if (!article || !(await this.articlesService.remove(id, request.user))) {
      throw new NotFoundException(`Article ${id} not found`);
    }

    await this.articleImagesService.remove(article.imagePath);
  }

  @Put(':id')
  @UseGuards(JwtAuthenticationGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: ArticleOutputDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateArticleDto: UpdateArticleDto,
    @Request() request: ExpressRequest & { user: User },
  ): Promise<ArticleOutputDto> {
    const article = await this.articlesService.update(id, updateArticleDto, request.user);

    if (!article) {
      throw new NotFoundException(`Article ${id} not found`);
    }

    return ArticleOutputDto.hydrate(article);
  }

  @Patch(':id/publication')
  @UseGuards(JwtAuthenticationGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: ArticleOutputDto })
  async updatePublication(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateArticlePublicationDto: UpdateArticlePublicationDto,
    @Request() request: ExpressRequest & { user: User },
  ): Promise<ArticleOutputDto> {
    const article = await this.articlesService.updatePublication(
      id,
      updateArticlePublicationDto.published,
      request.user,
    );

    if (!article) {
      throw new NotFoundException(`Article ${id} not found`);
    }

    return ArticleOutputDto.hydrate(article);
  }

  @Post()
  @UseGuards(JwtAuthenticationGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: ArticleOutputDto })
  async create(
    @Body() createArticleDto: CreateArticleDto,
    @Request() request: ExpressRequest & { user: User },
  ): Promise<ArticleOutputDto> {
    return ArticleOutputDto.hydrate(await this.articlesService.create(createArticleDto, request.user));
  }

  @Post(':id/image')
  @UseGuards(JwtAuthenticationGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
          callback(new BadRequestException('Only PNG, JPEG, and WebP images are allowed'), false);
          return;
        }

        callback(null, true);
      },
    }),
  )
  @ApiBearerAuth()
  async uploadImage(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File | undefined, @Request() request: ExpressRequest & { user: User }): Promise<ArticleOutputDto> {
    if (!file) throw new BadRequestException('Image is required');

    const currentArticle = await this.articlesService.findOneForOwner(id, request.user);
    if (!currentArticle) throw new NotFoundException(`Article ${id} not found`);

    const extension = this.articleImagesService.getValidatedExtension(file);
    if (!extension) throw new BadRequestException('Image content does not match its MIME type');

    const imagePath = await this.articleImagesService.store(file, extension);

    try {
      const article = await this.articlesService.setImage(id, imagePath, request.user);
      if (!article) throw new NotFoundException(`Article ${id} not found`);

      await this.articleImagesService.remove(currentArticle.imagePath);

      return ArticleOutputDto.hydrate(article);
    } catch (error) {
      await this.articleImagesService.remove(imagePath);
      throw error;
    }
  }
}
