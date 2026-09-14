import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Tag } from './tag.js';

export type CreateTagData = Pick<Tag, 'name' | 'slug'>;
export type UpdateTagData = Pick<Tag, 'name' | 'slug'>;

@Injectable()
export class TagsService {
  constructor(@InjectRepository(Tag) private readonly repository: Repository<Tag>) {}

  findAll(): Promise<Tag[]> {
    return this.repository.find({ order: { name: 'ASC' } });
  }

  async create(data: CreateTagData): Promise<Tag> {
    await this.assertUnique(data);

    return this.repository.save(this.repository.create(data));
  }

  async update(id: number, data: UpdateTagData): Promise<Tag | null> {
    const tag = await this.repository.findOneBy({ id });

    if (!tag) {
      return null;
    }

    await this.assertUnique(data, tag.id);
    tag.name = data.name;
    tag.slug = data.slug;

    return this.repository.save(tag);
  }

  async remove(id: number): Promise<boolean> {
    return (await this.repository.delete(id)).affected === 1;
  }

  private async assertUnique(data: CreateTagData, currentId?: number): Promise<void> {
    const duplicate = await this.repository.findOne({
      where: [{ name: data.name }, { slug: data.slug }],
    });

    if (duplicate && duplicate.id !== currentId) {
      throw new ConflictException('Tag name or slug already exists');
    }
  }
}
