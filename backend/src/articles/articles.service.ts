import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Like, Not, type FindOptionsOrder, type FindOptionsWhere, type Repository } from 'typeorm';
import { Article } from './article.js';
import type { SortDirection, SortableArticleField } from './dto/input/pagination-query.dto.js';
import type { User } from '../users/user.js';
import { Category } from '../categories/category.js';
import { Tag } from '../tags/tag.js';
import type { CreateArticleDto } from './dto/input/create-article.dto.js';
import type { UpdateArticleDto } from './dto/input/update-article.dto.js';

export type CreateArticleData = CreateArticleDto;

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articlesRepository: Repository<Article>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  findAllPublished(
    page: number,
    limit: number,
    sortBy: SortableArticleField,
    sortDirection: SortDirection,
    search?: string,
    category?: string,
    tag?: string,
  ): Promise<[Article[], number]> {
    const where: FindOptionsWhere<Article> = { publishedAt: Not(IsNull()) };
    if (search) {
      where.title = Like(`%${search}%`);
    }
    if (category) {
      where.category = { slug: category };
    }
    if (tag) {
      where.tags = { slug: tag };
    }

    return this.articlesRepository.findAndCount({
      where,
      order: this.getOrder(sortBy, sortDirection),
      relations: { category: true, tags: true },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  countAll(): Promise<number> {
    return this.articlesRepository.count();
  }

  findAllByAuthor(author: User): Promise<Article[]> {
    return this.articlesRepository.find({
      where: { author: { id: author.id } },
      relations: { category: true, tags: true },
    });
  }

  findPublished(id: number): Promise<Article | null> {
    return this.articlesRepository.findOne({
      where: { id, publishedAt: Not(IsNull()) },
      relations: { category: true, tags: true },
    });
  }

  findOne(id: number): Promise<Article | null> {
    return this.articlesRepository.findOneBy({ id });
  }

  async update(id: number, data: UpdateArticleDto, author: User): Promise<Article | null> {
    const article = await this.findOneWithAuthor(id);

    if (!article) {
      return null;
    }

    this.assertOwnership(article, author);

    article.title = data.title;
    article.content = data.content;
    if (data.categorySlug !== undefined || data.tagSlugs !== undefined) {
      Object.assign(article, await this.resolveTaxonomy(data));
    }

    return this.articlesRepository.save(article);
  }

  async remove(id: number, author: User): Promise<boolean> {
    const article = await this.findOneWithAuthor(id);

    if (!article) {
      return false;
    }

    this.assertOwnership(article, author);

    await this.articlesRepository.softRemove(article);
    return true;
  }

  async findOneForOwner(id: number, author: User): Promise<Article | null> {
    const article = await this.findOneWithAuthor(id);

    if (!article) {
      return null;
    }

    this.assertOwnership(article, author);

    return article;
  }

  async create(data: CreateArticleData, author: User): Promise<Article> {
    const taxonomy = await this.resolveTaxonomy(data);
    return this.articlesRepository.save(this.articlesRepository.create({
      title: data.title,
      content: data.content,
      author,
      publishedAt: null,
      ...taxonomy,
    }));
  }

  async updatePublication(id: number, published: boolean, author: User): Promise<Article | null> {
    const article = await this.findOneWithAuthor(id);

    if (!article) {
      return null;
    }

    this.assertOwnership(article, author);
    article.publishedAt = published ? new Date() : null;

    return this.articlesRepository.save(article);
  }

  async setImage(id: number, imagePath: string, author: User): Promise<Article | null> {
    const article = await this.findOneWithAuthor(id);
    if (!article) return null;
    this.assertOwnership(article, author);
    article.imagePath = imagePath;
    return this.articlesRepository.save(article);
  }

  private findOneWithAuthor(id: number): Promise<Article | null> {
    return this.articlesRepository.findOne({ where: { id }, relations: { author: true } });
  }

  private getOrder(sortBy: SortableArticleField, sortDirection: SortDirection): FindOptionsOrder<Article> {
    switch (sortBy) {
      case 'title':
        return { title: sortDirection };
      case 'publishedAt':
        return { publishedAt: sortDirection };
      default:
        return { id: sortDirection };
    }
  }

  private assertOwnership(article: Article, author: User): void {
    if (article.author?.id !== author.id) {
      throw new ForbiddenException('Only the author can modify this article');
    }
  }

  private async resolveTaxonomy(data: Pick<CreateArticleDto, 'categorySlug' | 'tagSlugs'>): Promise<Pick<Article, 'category' | 'tags'>> {
    const category = data.categorySlug
      ? await this.categoriesRepository.findOneBy({ slug: data.categorySlug })
      : null;
    if (data.categorySlug && !category) {
      throw new NotFoundException(`Category ${data.categorySlug} not found`);
    }

    const tags = data.tagSlugs?.length
      ? await this.tagsRepository.findBy({ slug: In(data.tagSlugs) })
      : [];
    if (data.tagSlugs && tags.length !== data.tagSlugs.length) {
      throw new NotFoundException('One or more tags not found');
    }

    return { category, tags };
  }
}
