import {
  Body,
  Controller,
  Delete, Get, HttpCode, NotFoundException,
  Param,
  ParseIntPipe, Patch, Post, Request, UseGuards,
} from '@nestjs/common';
import {CommentsService} from "./comments.service.js";
import {CommentOutputDto} from "./dto/output/comment-output.dto.js";
import {ArticlesService} from "../articles/articles.service.js";
import {JwtAuthenticationGuard} from "../authentication/jwt-authentication.guard.js";
import type {Request as ExpressRequest} from "express";
import type {User} from "../users/user.js";
import {InputCommentDto} from "./dto/input/input-comment.dto.js";
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('articles/:articleId/comments')
@ApiTags('Comments')
export class CommentsController {
  constructor(
      private readonly commentsService: CommentsService,
      private readonly articlesService: ArticlesService,
  ) {}

  @Get()
  async findByArticle(@Param('articleId', ParseIntPipe) id: number): Promise<CommentOutputDto[]> {
    if(!await this.articlesService.findPublished(id)) {
      throw new NotFoundException(`Article ${id} not found`);
    }

    return (await this.commentsService.findAllByArticle(id))
        .map((comment) => CommentOutputDto.hydrate(comment));
  }

  @Post()
  @UseGuards(JwtAuthenticationGuard)
  @ApiBearerAuth()
  async createComment(
      @Param('articleId', ParseIntPipe) articleId: number,
      @Body() inputCommentDto: InputCommentDto,
      @Request() request: ExpressRequest & { user: User },
  ): Promise<CommentOutputDto> {
    const article = await this.articlesService.findPublished(articleId);
    if(!article) {
      throw new NotFoundException(`Article ${articleId} not found`);
    }

    return CommentOutputDto.hydrate(await this.commentsService.create(article, request.user, inputCommentDto))
  }

  @Patch(':id')
  @UseGuards(JwtAuthenticationGuard)
  @ApiBearerAuth()
  async updateComment(
      @Param('articleId', ParseIntPipe) articleId: number,
      @Param('id', ParseIntPipe) id: number,
      @Body() inputCommentDto: InputCommentDto,
      @Request() request: ExpressRequest & { user: User },
  ): Promise<CommentOutputDto> {
    const article = await this.articlesService.findOne(articleId);
    if(!article) {
      throw new NotFoundException(`Article ${articleId} not found`);
    }

    const comment = await this.commentsService.update(id, inputCommentDto, request.user, article.id);
    if(!comment) {
      throw new NotFoundException(`Comment ${id} not found`);
    }

    return CommentOutputDto.hydrate(comment)
  }

  @Delete(':id')
  @UseGuards(JwtAuthenticationGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  async deleteComment(
      @Param('articleId', ParseIntPipe) articleId: number,
      @Param('id', ParseIntPipe) id: number,
      @Request() request: ExpressRequest & { user: User },
  ): Promise<void> {
    const article = await this.articlesService.findOne(articleId);
    if (!article) {
      throw new NotFoundException(`Article ${articleId} not found`);
    }

    const isDeleted = await this.commentsService.delete(id, request.user, article.id);
    if (!isDeleted) {
      throw new NotFoundException(`Comment ${id} not found`);
    }
  }
}
