import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request, { App } from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApplication } from '../src/application-configuration.js';
import {Article} from "../src/articles/article.js";
import Comment from "../src/comments/comment.js";
import {LoginDto} from "../src/authentication/dto/input/login.dto.js";
import { User } from '../src/users/user.js';
import { UserRole } from '../src/users/user-role.js';

describe('Comments endpoint (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let dataSource: DataSource;
  const author: LoginDto = { email: 'author@example.com', password: 'development-password' };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
    dataSource = app.get(DataSource);
    await dataSource.dropDatabase();
    await dataSource.runMigrations();

    await request(app.getHttpServer()).post('/authentication/register').send(author).expect(201);
    accessToken = await getAccessToken(author);
  });

  afterEach(async () => {
    await app.close();
  });

  async function getAccessToken(author: LoginDto): Promise<string> {
    const login = await request(app.getHttpServer())
        .post('/authentication/login')
        .send(author)
        .expect(201);

    return login.body.accessToken;
  }

  async function createArticle(): Promise<Article> {
    const response = await request(app.getHttpServer())
        .post('/articles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'NestJS', content: 'A Node.js framework' })
        .expect(201);

    return response.body as Article;
  }

  async function createPublishedArticle(): Promise<Article> {
    const article = await createArticle();

    await publishArticle(article);

    return article;
  }

  async function publishArticle(article: Article): Promise<void> {
    await request(app.getHttpServer())
      .patch(`/articles/${article.id}/publication`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ published: true })
      .expect(200);
  }

  async function createComment(article: Article): Promise<Comment> {
    await publishArticle(article);

    const response = await request(app.getHttpServer())
        .post(`/articles/${article.id}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'article comment' })
        .expect(201);

    return response.body as Comment;
  }

  async function getAdministratorAccessToken(): Promise<string> {
    const administrator: LoginDto = { email: 'administrator@example.com', password: 'development-password' };
    await request(app.getHttpServer()).post('/authentication/register').send(administrator).expect(201);
    await dataSource.getRepository(User).update({ email: administrator.email }, { role: UserRole.ADMIN });

    return getAccessToken(administrator);
  }

  it('GET /articles/:id/comments does not expose comments from a draft article', async () => {
    const article = await createArticle();
    return request(app.getHttpServer()).get(`/articles/${article.id}/comments`).expect(404);
  });

  it('POST /articles/:id/comments rejects comments on a draft article', async () => {
    const article = await createArticle();

    return request(app.getHttpServer())
      .post(`/articles/${article.id}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ content: 'article comment' })
      .expect(404);
  });

  it('GET /articles/:id/comments returns an comment list initially', async () => {
    const article = await createPublishedArticle();
    return request(app.getHttpServer()).get(`/articles/${article.id}/comments`).expect(200).expect([]);
  });

  it('GET /articles/:id/comments returns a 404 with not found article', async () => {
    return request(app.getHttpServer()).get('/articles/9999/comments').expect(404);
  });

  it('POST /articles/:id/comments returns a 404 with not found article', async () => {
    return request(app.getHttpServer())
        .post('/articles/9999/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'test' })
        .expect(404);
  });

  it('POST /articles/:id/comments returns a comment', async () => {
    const article = await createPublishedArticle();
    const comment = await createComment(article);
    expect(comment).toMatchObject({ content: 'article comment' });
    expect(comment.id).toEqual(expect.any(Number));
  });

  it('POST /articles/:id/comments returns a 400 with empty content', async () => {
    const article = await createPublishedArticle();
    await request(app.getHttpServer())
        .post(`/articles/${article.id}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '' })
        .expect(400);
  });

  it('POST /articles/:id/comments returns a 401 with no authorization', async () => {
    const article = await createPublishedArticle();
    await request(app.getHttpServer())
        .post(`/articles/${article.id}/comments`)
        .send({ content: 'comment' })
        .expect(401);
  });

  it('PATCH /articles/:articleId/comments/:id returns a 404 with not found article', async () => {
    return request(app.getHttpServer())
        .patch('/articles/9999/comments/1')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'test' })
        .expect(404);
  });

  it('PATCH /articles/:articleId/comments/:id returns a 404 with not found comment', async () => {
    const article = await createArticle();
    return request(app.getHttpServer())
        .patch(`/articles/${article.id}/comments/1`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'test' })
        .expect(404);
  });

  it('PATCH /articles/:articleId/comments/:id returns a 400 with empty comment', async () => {
    const article = await createArticle();
    const comment = await createComment(article);
    return request(app.getHttpServer())
        .patch(`/articles/${article.id}/comments/${comment.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '' })
        .expect(400);
  });

  it('PATCH /articles/:articleId/comments/:id returns a 401 with no authorization', async () => {
    const article = await createArticle();
    const comment = await createComment(article);
    return request(app.getHttpServer())
        .patch(`/articles/${article.id}/comments/${comment.id}`)
        .send({ content: 'test edited' })
        .expect(401);
  });

  it('PATCH /articles/:articleId/comments/:id updates a comment', async () => {
    const article = await createArticle();
    const comment = await createComment(article);
    const response = await request(app.getHttpServer())
        .patch(`/articles/${article.id}/comments/${comment.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'test edited'})
        .expect(200);

    const updatedComment = response.body as Comment;
    expect(updatedComment).toMatchObject({ content: 'test edited' });
  });

  it('PATCH /articles/:articleId/comments/:id returns 403 for a non-author', async () => {
    const article = await createArticle();
    const comment = await createComment(article);

    const otherAuthor: LoginDto = { email: 'author2@example.com', password: 'development-password' };
    await request(app.getHttpServer()).post('/authentication/register').send(otherAuthor).expect(201);

    return request(app.getHttpServer())
        .patch(`/articles/${article.id}/comments/${comment.id}`)
        .set('Authorization', `Bearer ${await getAccessToken(otherAuthor)}`)
        .send({ content: 'test edited'})
        .expect(403);
  });

  it('PATCH /articles/:articleId/comments/:id allows an administrator to moderate another user\'s comment', async () => {
    const article = await createArticle();
    const comment = await createComment(article);

    const response = await request(app.getHttpServer())
      .patch(`/articles/${article.id}/comments/${comment.id}`)
      .set('Authorization', `Bearer ${await getAdministratorAccessToken()}`)
      .send({ content: 'moderated content' })
      .expect(200);

    expect(response.body).toMatchObject({ id: comment.id, content: 'moderated content' });
  });

  it('PATCH /articles/:articleId/comments/:id returns 403 for a comment from another article', async () => {
    const article = await createArticle();
    const otherArticle = await createArticle();
    const comment = await createComment(otherArticle);

    return request(app.getHttpServer())
        .patch(`/articles/${article.id}/comments/${comment.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'test edited'})
        .expect(403);
  });

  it('DELETE /articles/:articleId/comments/:id soft deletes a comment', async () => {
    const article = await createArticle();
    const comment = await createComment(article);

    await request(app.getHttpServer())
        .delete(`/articles/${article.id}/comments/${comment.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

    await request(app.getHttpServer())
        .get(`/articles/${article.id}/comments`)
        .expect(200)
        .expect([]);
  });

  it('DELETE /articles/:articleId/comments/:id returns 404 for a missing article', async () => {
    return request(app.getHttpServer())
        .delete('/articles/9999/comments/1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
  });

  it('DELETE /articles/:articleId/comments/:id returns 404 for a missing comment', async () => {
    const article = await createArticle();

    return request(app.getHttpServer())
        .delete(`/articles/${article.id}/comments/9999`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
  });

  it('DELETE /articles/:articleId/comments/:id returns 401 without authentication', async () => {
    const article = await createArticle();
    const comment = await createComment(article);

    return request(app.getHttpServer())
        .delete(`/articles/${article.id}/comments/${comment.id}`)
        .expect(401);
  });

  it('DELETE /articles/:articleId/comments/:id returns 403 for a non-author', async () => {
    const article = await createArticle();
    const comment = await createComment(article);
    const otherAuthor: LoginDto = { email: 'author2@example.com', password: 'development-password' };
    await request(app.getHttpServer()).post('/authentication/register').send(otherAuthor).expect(201);

    return request(app.getHttpServer())
        .delete(`/articles/${article.id}/comments/${comment.id}`)
        .set('Authorization', `Bearer ${await getAccessToken(otherAuthor)}`)
        .expect(403);
  });

  it('DELETE /articles/:articleId/comments/:id allows an administrator to remove another user\'s comment', async () => {
    const article = await createArticle();
    const comment = await createComment(article);

    await request(app.getHttpServer())
      .delete(`/articles/${article.id}/comments/${comment.id}`)
      .set('Authorization', `Bearer ${await getAdministratorAccessToken()}`)
      .expect(204);

    await request(app.getHttpServer()).get(`/articles/${article.id}/comments`).expect(200).expect([]);
  });

  it('DELETE /articles/:articleId/comments/:id returns 403 for a comment from another article', async () => {
    const article = await createArticle();
    const otherArticle = await createArticle();
    const comment = await createComment(otherArticle);

    return request(app.getHttpServer())
        .delete(`/articles/${article.id}/comments/${comment.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
  });
});
