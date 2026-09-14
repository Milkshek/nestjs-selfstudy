import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request, { App } from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApplication } from '../src/application-configuration.js';

describe('Statistics endpoint (e2e)', () => {
  let app: INestApplication<App>;

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
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /statistics/articles-count returns number of existing articles', async () => {
    const user = { email: 'author@example.com', password: 'development-password' };
    await request(app.getHttpServer()).post('/authentication/register').send(user).expect(201);
    const login = await request(app.getHttpServer())
      .post('/authentication/login')
      .send(user)
      .expect(201);

    await request(app.getHttpServer())
      .post('/articles')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({ title: 'NestJS', content: 'A Node.js framework' })
      .expect(201);

    return request(app.getHttpServer()).get('/statistics/articles-count').expect(200).expect({ count: 1 });
  });
});
