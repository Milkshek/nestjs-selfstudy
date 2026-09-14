import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { TagOutputDto } from './dto/output/tag-output.dto.js';
import { TagsService } from './tags.service.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard.js';
import { RequireRoles } from '../authentication/required-roles.decorator.js';
import { RoleAuthorizationGuard } from '../authentication/role-authorization.guard.js';
import { UserRole } from '../users/user-role.js';
import { CreateTagDto } from './dto/input/create-tag.dto.js';
import { UpdateTagDto } from './dto/input/update-tag.dto.js';

@Controller('tags')
@ApiTags('Tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  async findAll(): Promise<TagOutputDto[]> {
    return (await this.tagsService.findAll()).map(TagOutputDto.hydrate);
  }

  @Post()
  @UseGuards(JwtAuthenticationGuard, RoleAuthorizationGuard)
  @RequireRoles(UserRole.ADMIN)
  @ApiBearerAuth()
  async create(@Body() createTagDto: CreateTagDto): Promise<TagOutputDto> {
    return TagOutputDto.hydrate(await this.tagsService.create(createTagDto));
  }

  @Put(':id')
  @UseGuards(JwtAuthenticationGuard, RoleAuthorizationGuard)
  @RequireRoles(UserRole.ADMIN)
  @ApiBearerAuth()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<TagOutputDto> {
    const tag = await this.tagsService.update(id, updateTagDto);

    if (!tag) {
      throw new NotFoundException(`Tag ${id} not found`);
    }

    return TagOutputDto.hydrate(tag);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthenticationGuard, RoleAuthorizationGuard)
  @RequireRoles(UserRole.ADMIN)
  @ApiBearerAuth()
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    if (!(await this.tagsService.remove(id))) {
      throw new NotFoundException(`Tag ${id} not found`);
    }
  }
}
