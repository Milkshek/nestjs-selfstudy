import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { CategoryOutputDto } from './dto/output/category-output.dto.js';
import { CategoriesService } from './categories.service.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard.js';
import { CreateCategoryDto } from './dto/input/create-category.dto.js';
import { RequireRoles } from '../authentication/required-roles.decorator.js';
import { RoleAuthorizationGuard } from '../authentication/role-authorization.guard.js';
import { UserRole } from '../users/user-role.js';
import { UpdateCategoryDto } from './dto/input/update-category.dto.js';

@Controller('categories')
@ApiTags('Categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(): Promise<CategoryOutputDto[]> {
    return (await this.categoriesService.findAll()).map(CategoryOutputDto.hydrate);
  }

  @Post()
  @UseGuards(JwtAuthenticationGuard, RoleAuthorizationGuard)
  @RequireRoles(UserRole.ADMIN)
  @ApiBearerAuth()
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryOutputDto> {
    return CategoryOutputDto.hydrate(await this.categoriesService.create(createCategoryDto));
  }

  @Put(':id')
  @UseGuards(JwtAuthenticationGuard, RoleAuthorizationGuard)
  @RequireRoles(UserRole.ADMIN)
  @ApiBearerAuth()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryOutputDto> {
    const category = await this.categoriesService.update(id, updateCategoryDto);

    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    return CategoryOutputDto.hydrate(category);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthenticationGuard, RoleAuthorizationGuard)
  @RequireRoles(UserRole.ADMIN)
  @ApiBearerAuth()
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    if (!(await this.categoriesService.remove(id))) {
      throw new NotFoundException(`Category ${id} not found`);
    }
  }
}
