import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Category } from './category.js';

export type CreateCategoryData = Pick<Category, 'name' | 'slug'>;
export type UpdateCategoryData = Pick<Category, 'name' | 'slug'>;

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private readonly repository: Repository<Category>) {}

  findAll(): Promise<Category[]> {
    return this.repository.find({ order: { name: 'ASC' } });
  }

  async create(data: CreateCategoryData): Promise<Category> {
    await this.assertUnique(data);

    return this.repository.save(this.repository.create(data));
  }

  async update(id: number, data: UpdateCategoryData): Promise<Category | null> {
    const category = await this.repository.findOneBy({ id });

    if (!category) {
      return null;
    }

    await this.assertUnique(data, category.id);
    category.name = data.name;
    category.slug = data.slug;

    return this.repository.save(category);
  }

  async remove(id: number): Promise<boolean> {
    return (await this.repository.delete(id)).affected === 1;
  }

  private async assertUnique(data: CreateCategoryData, currentId?: number): Promise<void> {
    const duplicate = await this.repository.findOne({
      where: [{ name: data.name }, { slug: data.slug }],
    });

    if (duplicate && duplicate.id !== currentId) {
      throw new ConflictException('Category name or slug already exists');
    }
  }
}
