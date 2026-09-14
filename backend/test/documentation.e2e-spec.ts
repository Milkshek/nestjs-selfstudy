import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { App } from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApplication } from '../src/application-configuration.js';

describe('API documentation (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api-json returns the OpenAPI document', async () => {
    const response = await request(app.getHttpServer()).get('/api-json').expect(200);

    expect(response.body).toMatchObject({
      openapi: expect.any(String),
      info: {
        title: 'BlogNest API',
        version: '1.0',
      },
    });
  });

  it('groups article routes and marks protected operations', async () => {
    const response = await request(app.getHttpServer()).get('/api-json').expect(200);

    expect(response.body.paths['/articles'].get.tags).toEqual(['Articles']);
    expect(response.body.paths['/articles'].post.security).toEqual([{ bearer: [] }]);
    expect(response.body.paths['/authentication/login'].post.security).toBeUndefined();
  });

  it('marks taxonomy write operations as administrator-protected', async () => {
    const response = await request(app.getHttpServer()).get('/api-json').expect(200);

    expect(response.body.paths['/categories'].post.security).toEqual([{ bearer: [] }]);
    expect(response.body.paths['/tags'].post.security).toEqual([{ bearer: [] }]);
  });

  it('describes article response properties', async () => {
    const response = await request(app.getHttpServer()).get('/api-json').expect(200);

    expect(response.body.components.schemas.ArticleOutputDto.properties).toMatchObject({
      id: { type: 'number' },
      title: { type: 'string' },
      content: { type: 'string' },
      tags: { type: 'array' },
    });
  });
});

describe('API documentation in production (e2e)', () => {
  let app: INestApplication<App>;
  const initialNodeEnvironment = process.env.NODE_ENV;

  beforeAll(() => {
    process.env.NODE_ENV = 'production';
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(() => {
    if (initialNodeEnvironment === undefined) {
      delete process.env.NODE_ENV;
      return;
    }

    process.env.NODE_ENV = initialNodeEnvironment;
  });

  it('enables CSP and does not expose the OpenAPI document', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.headers['content-security-policy']).toBeDefined();
    await request(app.getHttpServer()).get('/api-json').expect(404);
  });
});
