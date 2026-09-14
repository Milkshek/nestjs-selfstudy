import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import type { Request as ExpressRequest } from 'express';
import type { User } from '../users/user.js';
import { ArticlesController } from './articles.controller.js';
import { ArticlesService } from './articles.service.js';
import { ArticleOutputDto } from './dto/output/article-output.dto.js';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard.js';
import { ArticleImagesService } from './article-images.service.js';

describe('ArticlesController', () => {
  let controller: ArticlesController;
  let service: Pick<
    ArticlesService,
    'create' | 'findAllByAuthor' | 'findAllPublished' | 'findOne' | 'findOneForOwner' | 'findPublished' | 'remove' | 'update' | 'updatePublication'
  >;
  let articleImagesService: Pick<ArticleImagesService, 'remove'>;
  const request = {
    user: { id: 1, email: 'author@example.com', passwordHash: 'hash' },
  } as ExpressRequest & { user: User };

  beforeEach(async () => {
    service = {
      create: vi.fn(),
      findAllByAuthor: vi.fn(),
      findAllPublished: vi.fn(),
      findOne: vi.fn(),
      findOneForOwner: vi.fn(),
      findPublished: vi.fn(),
      remove: vi.fn(),
      update: vi.fn(),
      updatePublication: vi.fn(),
    };
    articleImagesService = { remove: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({})],
      controllers: [ArticlesController],
      providers: [
        { provide: ArticlesService, useValue: service },
        { provide: ArticleImagesService, useValue: articleImagesService },
        { provide: JwtAuthenticationGuard, useValue: { canActivate: vi.fn() } },
      ],
    }).compile();

    controller = module.get<ArticlesController>(ArticlesController);
  });

  it('returns the article list from the service', async () => {
    const articles = [{ id: 1, title: 'NestJS', content: 'A Node.js framework', author: request.user, deletedAt: null }];
    vi.mocked(service.findAllPublished).mockResolvedValue([articles, 1]);

    await expect(controller.findAll({ page: 1, limit: 10, sortBy: 'id', sortDirection: 'DESC' })).resolves.toEqual({
      data: articles.map((article) => ArticleOutputDto.hydrate(article)),
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    expect(service.findAllPublished).toHaveBeenCalledWith(1, 10, 'id', 'DESC', undefined, undefined, undefined);
  });

  it('creates an article through the service', async () => {
    const article = { id: 1, title: 'NestJS', content: 'A Node.js framework', author: request.user, deletedAt: null };
    vi.mocked(service.create).mockResolvedValue(article);
    const hydrate = vi.spyOn(ArticleOutputDto, 'hydrate');

    await expect(controller.create({ title: article.title, content: article.content }, request)).resolves.toEqual(
      ArticleOutputDto.hydrate(article),
    );
    expect(hydrate).toHaveBeenCalledWith(article);
  });

  it('returns an article by identifier', async () => {
    const article = { id: 1, title: 'NestJS', content: 'A Node.js framework', author: request.user, deletedAt: null };
    vi.mocked(service.findPublished).mockResolvedValue(article);
    const hydrate = vi.spyOn(ArticleOutputDto, 'hydrate');

    await expect(controller.findOne(article.id)).resolves.toEqual(ArticleOutputDto.hydrate(article));
    expect(hydrate).toHaveBeenCalledWith(article);
  });

  it('throws NotFoundException when the article is absent', async () => {
    vi.mocked(service.findPublished).mockResolvedValue(null);

    await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('replaces an existing article', async () => {
    const article = { id: 1, title: 'New title', content: 'New content', author: request.user, deletedAt: null };
    vi.mocked(service.update).mockResolvedValue(article);
    const hydrate = vi.spyOn(ArticleOutputDto, 'hydrate');

    await expect(controller.update(article.id, article, request)).resolves.toEqual(ArticleOutputDto.hydrate(article));
    expect(hydrate).toHaveBeenCalledWith(article);
  });

  it('throws NotFoundException when updating an absent article', async () => {
    vi.mocked(service.update).mockResolvedValue(null);

    await expect(
      controller.update(999, { title: 'New title', content: 'New content' }, request),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns all articles owned by the authenticated user', async () => {
    const articles = [{ id: 1, title: 'Draft', content: 'Draft content', author: request.user, publishedAt: null }];
    vi.mocked(service.findAllByAuthor).mockResolvedValue(articles);

    await expect(controller.findMine(request)).resolves.toEqual(articles.map(ArticleOutputDto.hydrate));
    expect(service.findAllByAuthor).toHaveBeenCalledWith(request.user);
  });

  it('updates the publication state of an article', async () => {
    const article = {
      id: 1,
      title: 'NestJS',
      content: 'A Node.js framework',
      author: request.user,
      publishedAt: new Date(),
    };
    vi.mocked(service.updatePublication).mockResolvedValue(article);

    await expect(controller.updatePublication(article.id, { published: true }, request))
      .resolves.toEqual(ArticleOutputDto.hydrate(article));
    expect(service.updatePublication).toHaveBeenCalledWith(article.id, true, request.user);
  });

  it('removes an existing article', async () => {
    vi.mocked(service.findOneForOwner).mockResolvedValue({ id: 1, imagePath: null } as never);
    vi.mocked(service.remove).mockResolvedValue(true);

    await expect(controller.remove(1, request)).resolves.toBeUndefined();
  });

  it('throws NotFoundException when removing an absent article', async () => {
    vi.mocked(service.findOneForOwner).mockResolvedValue(null);
    vi.mocked(service.remove).mockResolvedValue(false);

    await expect(controller.remove(999, request)).rejects.toThrow(NotFoundException);
  });
});
