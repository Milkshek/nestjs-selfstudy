import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request, { App } from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApplication } from '../src/application-configuration.js';

describe('Users endpoint (e2e)', () => {
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

  it('GET /users is not exposed publicly', () => {
    return request(app.getHttpServer()).get('/users').expect(404);
  });

});
