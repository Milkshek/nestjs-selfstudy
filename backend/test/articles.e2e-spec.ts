import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { access, readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';
import request, { App } from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApplication } from '../src/application-configuration.js';
import {Article} from "../src/articles/article.js";
import { Category } from '../src/categories/category.js';
import { Tag } from '../src/tags/tag.js';

describe('Articles endpoint (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let uploadedImagePath: string | null = null;
  const author = { email: 'author@example.com', password: 'development-password' };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
    const dataSource = app.get(DataSource);
    await dataSource.dropDatabase();
    await dataSource.runMigrations();

    await request(app.getHttpServer()).post('/authentication/register').send(author).expect(201);
    const login = await request(app.getHttpServer())
      .post('/authentication/login')
      .send(author)
      .expect(201);
    accessToken = login.body.accessToken;
  });

  afterEach(async () => {
    if (uploadedImagePath) {
      await rm(resolve('uploads', uploadedImagePath.replace('/uploads/', '')), { force: true });
      uploadedImagePath = null;
    }
    await app.close();
  });

  async function createArticle(title = 'NestJS', content = 'A Node.js framework'): Promise<Article> {
    const response = await request(app.getHttpServer())
      .post('/articles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title, content })
      .expect(201);

    return response.body as Article;
  }

  it('GET /articles returns an empty paginated list initially', () => {
    return request(app.getHttpServer()).get('/articles').expect(200).expect({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });
  });

  it('GET /articles marks its public response cacheable', async () => {
    const response = await request(app.getHttpServer()).get('/articles').expect(200);

    expect(response.headers['cache-control']).toBe('public, max-age=60');
  });

  it('GET /articles responds with 304 when its ETag is still current', async () => {
    const response = await request(app.getHttpServer()).get('/articles').expect(200);

    expect(response.headers.etag).toEqual(expect.any(String));
    await request(app.getHttpServer())
      .get('/articles')
      .set('If-None-Match', response.headers.etag)
      .expect(304);
  });

  it('POST /articles creates an article', async () => {
    const article = await createArticle();

    expect(article).toMatchObject({ title: 'NestJS', content: 'A Node.js framework' });
    expect(article.id).toEqual(expect.any(Number));
  });

  it('POST /articles rejects an invalid request body', () => {
    return request(app.getHttpServer())
      .post('/articles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: '' })
      .expect(400);
  });

  it('POST /articles returns 401 without a Bearer token', () => {
    return request(app.getHttpServer())
      .post('/articles')
      .send({ title: 'NestJS', content: 'A Node.js framework' })
      .expect(401);
  });

  it('GET /articles/:id does not expose a draft article', async () => {
    const article = await createArticle();

    return request(app.getHttpServer()).get(`/articles/${article.id}`).expect(404);
  });

  it('GET /articles/:id marks its public response cacheable', async () => {
    const article = await createArticle();
    await request(app.getHttpServer())
      .patch(`/articles/${article.id}/publication`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ published: true })
      .expect(200);

    const response = await request(app.getHttpServer()).get(`/articles/${article.id}`).expect(200);

    expect(response.headers['cache-control']).toBe('public, max-age=60');
  });

  it('GET /articles/:id returns 404 when absent', () => {
    return request(app.getHttpServer()).get('/articles/999999').expect(404);
  });

  it('GET /articles/:id returns 400 for a non-integer identifier', () => {
    return request(app.getHttpServer()).get('/articles/abc').expect(400);
  });

  it('PUT /articles/:id replaces an article', async () => {
    const article = await createArticle();

    return request(app.getHttpServer())
      .put(`/articles/${article.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'New title', content: 'New content' })
      .expect(200)
      .expect({ id: article.id, title: 'New title', content: 'New content', imagePath: null, publishedAt: null, category: null, tags: [] });
  });

  it('PUT /articles/:id rejects an incomplete body', () => {
    return request(app.getHttpServer())
      .put('/articles/1')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'New title' })
      .expect(400);
  });

  it('PUT /articles/:id returns 404 when absent', () => {
    return request(app.getHttpServer())
      .put('/articles/999999')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'New title', content: 'New content' })
      .expect(404);
  });

  it('DELETE /articles/:id removes an article', async () => {
    const article = await createArticle();

    await request(app.getHttpServer())
      .delete(`/articles/${article.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    return request(app.getHttpServer()).get(`/articles/${article.id}`).expect(404);
  });

  it('DELETE /articles/:id returns 404 when absent', () => {
    return request(app.getHttpServer())
      .delete('/articles/999999')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('DELETE /articles/:id returns 400 for a non-integer identifier', () => {
    return request(app.getHttpServer())
      .delete('/articles/abc')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
  });

  it('PUT /articles/:id returns 403 for another user', async () => {
    const article = await createArticle();
    const anotherUser = { email: 'another@example.com', password: 'development-password' };
    await request(app.getHttpServer()).post('/authentication/register').send(anotherUser).expect(201);
    const login = await request(app.getHttpServer())
      .post('/authentication/login')
      .send(anotherUser)
      .expect(201);

    return request(app.getHttpServer())
      .put(`/articles/${article.id}`)
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({ title: 'New title', content: 'New content' })
      .expect(403);
  });

  it('GET /articles/mine returns drafts owned by the authenticated user', async () => {
    const article = await createArticle();

    return request(app.getHttpServer())
      .get('/articles/mine')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect([{ id: article.id, title: article.title, content: article.content, imagePath: null, publishedAt: null, category: null, tags: [] }]);
  });

  it('PATCH /articles/:id/publication publishes an article publicly', async () => {
    const article = await createArticle();

    const publishResponse = await request(app.getHttpServer())
      .patch(`/articles/${article.id}/publication`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ published: true })
      .expect(200);

    expect(publishResponse.body).toMatchObject({ id: article.id, publishedAt: expect.any(String) });
    await request(app.getHttpServer()).get(`/articles/${article.id}`).expect(200);
    await request(app.getHttpServer()).get('/articles').expect(200).expect({
      data: [publishResponse.body],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
  });

  it('PATCH /articles/:id/publication unpublishes an article', async () => {
    const article = await createArticle();
    await request(app.getHttpServer())
      .patch(`/articles/${article.id}/publication`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ published: true })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/articles/${article.id}/publication`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ published: false })
      .expect(200)
      .expect({ id: article.id, title: article.title, content: article.content, imagePath: null, publishedAt: null, category: null, tags: [] });

    await request(app.getHttpServer()).get(`/articles/${article.id}`).expect(404);
  });

  it('GET /articles returns the requested page of published articles', async () => {
    const firstArticle = await createArticle();
    const secondArticle = await createArticle();
    await request(app.getHttpServer())
      .patch(`/articles/${firstArticle.id}/publication`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ published: true })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/articles/${secondArticle.id}/publication`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ published: true })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get('/articles?page=2&limit=1')
      .expect(200);

    expect(response.body).toMatchObject({
      data: [{ id: firstArticle.id }],
      meta: { page: 2, limit: 1, total: 2, totalPages: 2 },
    });
  });

  it('GET /articles rejects invalid pagination parameters', () => {
    return request(app.getHttpServer())
      .get('/articles?page=0&limit=101')
      .expect(400);
  });

  it('GET /articles sorts published articles by an allowed field', async () => {
    const zebraArticle = await createArticle('Zebra');
    const alphaArticle = await createArticle('Alpha');
    await request(app.getHttpServer())
      .patch(`/articles/${zebraArticle.id}/publication`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ published: true })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/articles/${alphaArticle.id}/publication`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ published: true })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get('/articles?sortBy=title&sortDirection=ASC')
      .expect(200);

    expect(response.body.data).toMatchObject([{ id: alphaArticle.id }, { id: zebraArticle.id }]);
  });

  it('GET /articles rejects an invalid sorting field', () => {
    return request(app.getHttpServer())
      .get('/articles?sortBy=deletedAt&sortDirection=UP')
      .expect(400);
  });

  it('GET /articles searches published articles by title', async () => {
    const nestArticle = await createArticle('NestJS guide');
    const typescriptArticle = await createArticle('TypeScript guide');
    await request(app.getHttpServer())
      .patch(`/articles/${nestArticle.id}/publication`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ published: true })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/articles/${typescriptArticle.id}/publication`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ published: true })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get('/articles?search=Nest')
      .expect(200);

    expect(response.body).toMatchObject({
      data: [{ id: nestArticle.id }],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
  });

  it('GET /articles filters published articles by category slug', async () => {
    const dataSource = app.get(DataSource);
    const category = await dataSource.getRepository(Category).save({ name: 'NestJS', slug: 'nestjs' });
    const nestArticle = await createArticle('NestJS guide');
    const typescriptArticle = await createArticle('TypeScript guide');
    const articlesRepository = dataSource.getRepository(Article);
    const persistedNestArticle = await articlesRepository.findOneByOrFail({ id: nestArticle.id });
    persistedNestArticle.category = category;
    await articlesRepository.save(persistedNestArticle);
    await request(app.getHttpServer())
      .patch(`/articles/${nestArticle.id}/publication`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ published: true })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/articles/${typescriptArticle.id}/publication`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ published: true })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get('/articles?category=nestjs')
      .expect(200);

    expect(response.body.data).toMatchObject([{
      id: nestArticle.id,
      category: { id: category.id, name: 'NestJS', slug: 'nestjs' },
    }]);
  });

  it('GET /articles filters published articles by tag slug', async () => {
    const dataSource = app.get(DataSource);
    const tag = await dataSource.getRepository(Tag).save({ name: 'NestJS', slug: 'nestjs' });
    const nestArticle = await createArticle('NestJS guide');
    const typescriptArticle = await createArticle('TypeScript guide');
    const articlesRepository = dataSource.getRepository(Article);
    const persistedNestArticle = await articlesRepository.findOne({ where: { id: nestArticle.id }, relations: { tags: true } });
    if (!persistedNestArticle) {
      throw new Error('Article not found');
    }
    persistedNestArticle.tags = [tag];
    await articlesRepository.save(persistedNestArticle);
    for (const article of [nestArticle, typescriptArticle]) {
      await request(app.getHttpServer())
        .patch(`/articles/${article.id}/publication`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ published: true })
        .expect(200);
    }

    const response = await request(app.getHttpServer()).get('/articles?tag=nestjs').expect(200);
    expect(response.body.data).toMatchObject([{ id: nestArticle.id, tags: [{ id: tag.id, slug: 'nestjs' }] }]);
  });

  it('POST /articles assigns an existing category and tags', async () => {
    const dataSource = app.get(DataSource);
    await dataSource.getRepository(Category).save({ name: 'NestJS', slug: 'nestjs' });
    await dataSource.getRepository(Tag).save([
      { name: 'Backend', slug: 'backend' },
      { name: 'TypeScript', slug: 'typescript' },
    ]);

    const response = await request(app.getHttpServer())
      .post('/articles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'NestJS',
        content: 'A framework',
        categorySlug: 'nestjs',
        tagSlugs: ['backend', 'typescript'],
      })
      .expect(201);

    expect(response.body).toMatchObject({
      category: { slug: 'nestjs' },
      tags: [{ slug: 'backend' }, { slug: 'typescript' }],
    });
  });

  it('POST /articles/:id/image stores an image for its author', async () => {
    const article = await createArticle();
    const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL2lAAAAABJRU5ErkJggg==', 'base64');

    const response = await request(app.getHttpServer())
      .post(`/articles/${article.id}/image`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('image', image, { filename: 'cover.png', contentType: 'image/png' })
      .expect(201);

    expect(response.body).toMatchObject({ id: article.id, imagePath: expect.stringMatching(/^\/uploads\/articles\//) });
    uploadedImagePath = response.body.imagePath;
  });

  it('POST /articles/:id/image rejects SVG files', async () => {
    const article = await createArticle();

    await request(app.getHttpServer())
      .post(`/articles/${article.id}/image`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('image', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'), {
        filename: 'cover.svg',
        contentType: 'image/svg+xml',
      })
      .expect(400);
  });

  it('POST /articles/:id/image rejects a file whose bytes do not match its MIME type', async () => {
    const article = await createArticle();

    await request(app.getHttpServer())
      .post(`/articles/${article.id}/image`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('image', Buffer.from('not a PNG file'), { filename: 'cover.png', contentType: 'image/png' })
      .expect(400);
  });

  it('POST /articles/:id/image does not persist a file when the caller is not the author', async () => {
    const article = await createArticle();
    const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL2lAAAAABJRU5ErkJggg==', 'base64');
    const filesBeforeUpload = await readdir(resolve('uploads/articles'));
    const anotherUser = { email: 'another-image-author@example.com', password: 'development-password' };
    await request(app.getHttpServer()).post('/authentication/register').send(anotherUser).expect(201);
    const login = await request(app.getHttpServer()).post('/authentication/login').send(anotherUser).expect(201);

    await request(app.getHttpServer())
      .post(`/articles/${article.id}/image`)
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .attach('image', image, { filename: 'cover.png', contentType: 'image/png' })
      .expect(403);

    await expect(readdir(resolve('uploads/articles'))).resolves.toEqual(filesBeforeUpload);
  });

  it('POST /articles/:id/image and DELETE /articles/:id remove obsolete image files', async () => {
    const article = await createArticle();
    const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL2lAAAAABJRU5ErkJggg==', 'base64');
    const firstUpload = await request(app.getHttpServer())
      .post(`/articles/${article.id}/image`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('image', image, { filename: 'cover.png', contentType: 'image/png' })
      .expect(201);
    const firstImagePath = firstUpload.body.imagePath as string;

    const secondUpload = await request(app.getHttpServer())
      .post(`/articles/${article.id}/image`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('image', image, { filename: 'replacement.png', contentType: 'image/png' })
      .expect(201);
    const secondImagePath = secondUpload.body.imagePath as string;

    await expect(access(resolve('uploads', firstImagePath.replace('/uploads/', '')))).rejects.toThrow();

    await request(app.getHttpServer())
      .delete(`/articles/${article.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await expect(access(resolve('uploads', secondImagePath.replace('/uploads/', '')))).rejects.toThrow();
  });

  it('PUT /articles/:id replaces the article taxonomy when slugs are supplied', async () => {
    const dataSource = app.get(DataSource);
    await dataSource.getRepository(Category).save({ name: 'NestJS', slug: 'nestjs' });
    await dataSource.getRepository(Tag).save({ name: 'Backend', slug: 'backend' });
    const article = await createArticle();

    const response = await request(app.getHttpServer())
      .put(`/articles/${article.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Updated', content: 'Updated content', categorySlug: 'nestjs', tagSlugs: ['backend'] })
      .expect(200);

    expect(response.body).toMatchObject({ category: { slug: 'nestjs' }, tags: [{ slug: 'backend' }] });
  });
});
