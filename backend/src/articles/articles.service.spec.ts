import type { Repository } from 'typeorm';
import { ArticlesService } from './articles.service.js';
import type { Article } from './article.js';
import type { User } from '../users/user.js';

describe('ArticlesService', () => {
  let repository: Pick<
    Repository<Article>,
    'count' | 'create' | 'find' | 'findAndCount' | 'findOne' | 'findOneBy' | 'save' | 'softRemove'
  >;
  let service: ArticlesService;

  beforeEach(() => {
    repository = {
      count: vi.fn(),
      create: vi.fn(),
      find: vi.fn(),
      findAndCount: vi.fn(),
      findOne: vi.fn(),
      findOneBy: vi.fn(),
      save: vi.fn(),
      softRemove: vi.fn(),
    };
    service = new ArticlesService(repository as Repository<Article>);
  });

  it('returns published articles from the repository', async () => {
    const articles = [{ id: 1, title: 'NestJS', content: 'A Node.js framework' } as Article];
    vi.mocked(repository.findAndCount).mockResolvedValue([articles, 1]);

    await expect(service.findAllPublished(1, 10, 'title', 'ASC', 'Nest')).resolves.toEqual([articles, 1]);
    expect(repository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
      order: { title: 'ASC' },
      skip: 0,
      take: 10,
    }));
  });

  it('creates and saves an article through the repository', async () => {
    const author = { id: 1, email: 'author@example.com', passwordHash: 'hash' } as User;
    const data = { title: 'NestJS', content: 'A Node.js framework' };
    const article = { ...data, author, publishedAt: null, category: null, tags: [] } as Article;
    const savedArticle = { id: 1, ...article } as Article;
    vi.mocked(repository.create).mockReturnValue(article);
    vi.mocked(repository.save).mockResolvedValue(savedArticle);

    await expect(service.create(data, author)).resolves.toEqual(savedArticle);
    expect(repository.create).toHaveBeenCalledWith(article);
    expect(repository.save).toHaveBeenCalledWith(article);
  });

  it('returns an article by identifier or null when it is absent', async () => {
    const article = { id: 1, title: 'NestJS', content: 'A Node.js framework' } as Article;
    vi.mocked(repository.findOneBy).mockResolvedValueOnce(article).mockResolvedValueOnce(null);

    await expect(service.findOne(1)).resolves.toEqual(article);
    await expect(service.findOne(999)).resolves.toBeNull();
  });

  it('returns all articles owned by a user', async () => {
    const author = { id: 1, email: 'author@example.com', passwordHash: 'hash' } as User;
    const articles = [{ id: 1, title: 'Draft', content: 'Draft content', author } as Article];
    vi.mocked(repository.find).mockResolvedValue(articles);

    await expect(service.findAllByAuthor(author)).resolves.toEqual(articles);
  });

  it('counts all non-deleted articles', async () => {
    vi.mocked(repository.count).mockResolvedValue(2);

    await expect(service.countAll()).resolves.toBe(2);
  });

  it('replaces an existing article and returns null when it is absent', async () => {
    const author = { id: 1, email: 'author@example.com', passwordHash: 'hash' } as User;
    const article = { id: 1, title: 'Old title', content: 'Old content', author } as Article;
    const updatedArticle = { id: 1, title: 'New title', content: 'New content' } as Article;
    vi.mocked(repository.findOne).mockResolvedValueOnce(article).mockResolvedValueOnce(null);
    vi.mocked(repository.save).mockResolvedValue(updatedArticle);

    await expect(service.update(1, updatedArticle, author)).resolves.toEqual(updatedArticle);
    await expect(service.update(999, updatedArticle, author)).resolves.toBeNull();
  });

  it('removes an existing article and reports an absent article', async () => {
    const author = { id: 1, email: 'author@example.com', passwordHash: 'hash' } as User;
    const article = { id: 1, title: 'NestJS', content: 'A Node.js framework', author } as Article;
    vi.mocked(repository.findOne).mockResolvedValueOnce(article).mockResolvedValueOnce(null);
    vi.mocked(repository.softRemove).mockResolvedValue(article);

    await expect(service.remove(1, author)).resolves.toBe(true);
    await expect(service.remove(999, author)).resolves.toBe(false);
    expect(repository.softRemove).toHaveBeenCalledWith(article);
  });

  it('publishes and unpublishes an article owned by the author', async () => {
    const author = { id: 1, email: 'author@example.com', passwordHash: 'hash' } as User;
    const article = { id: 1, title: 'NestJS', content: 'A Node.js framework', author, publishedAt: null } as Article;
    vi.mocked(repository.findOne).mockResolvedValue(article);
    vi.mocked(repository.save).mockResolvedValue(article);

    await expect(service.updatePublication(article.id, true, author)).resolves.toEqual(article);
    expect(article.publishedAt).toBeInstanceOf(Date);

    await expect(service.updatePublication(article.id, false, author)).resolves.toEqual(article);
    expect(article.publishedAt).toBeNull();
  });
});
