import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request, { App } from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApplication } from '../src/application-configuration.js';
import { Category } from '../src/categories/category.js';
import { Tag } from '../src/tags/tag.js';
import { User } from '../src/users/user.js';
import { UserRole } from '../src/users/user-role.js';

describe('Taxonomies endpoints (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeEach(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    configureApplication(app);
    await app.init();
    dataSource = app.get(DataSource);
    await dataSource.dropDatabase();
    await dataSource.runMigrations();
    await dataSource.getRepository(Category).save([
      { name: 'TypeORM', slug: 'typeorm' },
      { name: 'NestJS', slug: 'nestjs' },
    ]);
    await dataSource.getRepository(Tag).save([
      { name: 'Backend', slug: 'backend' },
      { name: 'JavaScript', slug: 'javascript' },
    ]);
  });

  afterEach(async () => app.close());

  async function getAdministratorAccessToken(): Promise<string> {
    const administrator = { email: 'administrator@example.com', password: 'development-password' };
    await request(app.getHttpServer()).post('/authentication/register').send(administrator).expect(201);
    await dataSource.getRepository(User).update({ email: administrator.email }, { role: UserRole.ADMIN });

    const login = await request(app.getHttpServer())
      .post('/authentication/login')
      .send(administrator)
      .expect(201);

    return login.body.accessToken;
  }

  it('GET /categories returns categories ordered by name', () => {
    return request(app.getHttpServer()).get('/categories').expect(200).expect([
      { id: 2, name: 'NestJS', slug: 'nestjs' },
      { id: 1, name: 'TypeORM', slug: 'typeorm' },
    ]);
  });

  it('GET /tags returns tags ordered by name', () => {
    return request(app.getHttpServer()).get('/tags').expect(200).expect([
      { id: 1, name: 'Backend', slug: 'backend' },
      { id: 2, name: 'JavaScript', slug: 'javascript' },
    ]);
  });

  it('POST /categories requires authentication', () => {
    return request(app.getHttpServer())
      .post('/categories')
      .send({ name: 'Testing', slug: 'testing' })
      .expect(401);
  });

  it('POST /categories returns 403 for a standard user', async () => {
    const user = { email: 'reader@example.com', password: 'development-password' };
    await request(app.getHttpServer()).post('/authentication/register').send(user).expect(201);
    const login = await request(app.getHttpServer()).post('/authentication/login').send(user).expect(201);

    await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({ name: 'Testing', slug: 'testing' })
      .expect(403);
  });

  it('POST /categories creates a category for an administrator', async () => {
    const response = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${await getAdministratorAccessToken()}`)
      .send({ name: 'Testing', slug: 'testing' })
      .expect(201);

    expect(response.body).toMatchObject({ name: 'Testing', slug: 'testing' });
  });

  it('POST /categories returns 409 when the name or slug already exists', async () => {
    await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${await getAdministratorAccessToken()}`)
      .send({ name: 'TypeORM', slug: 'typeorm' })
      .expect(409);
  });

  it('POST /tags creates a tag for an administrator', async () => {
    return request(app.getHttpServer())
      .post('/tags')
      .set('Authorization', `Bearer ${await getAdministratorAccessToken()}`)
      .send({ name: 'Testing', slug: 'testing' })
      .expect(201);
  });

  it('PUT /categories/:id updates a category for an administrator', async () => {
    const response = await request(app.getHttpServer())
      .put('/categories/1')
      .set('Authorization', `Bearer ${await getAdministratorAccessToken()}`)
      .send({ name: 'Updated TypeORM', slug: 'updated-typeorm' })
      .expect(200);

    expect(response.body).toMatchObject({ id: 1, name: 'Updated TypeORM', slug: 'updated-typeorm' });
  });

  it('DELETE /categories/:id deletes a category for an administrator', async () => {
    await request(app.getHttpServer())
      .delete('/categories/1')
      .set('Authorization', `Bearer ${await getAdministratorAccessToken()}`)
      .expect(204);

    await request(app.getHttpServer()).get('/categories').expect(200).expect([
      { id: 2, name: 'NestJS', slug: 'nestjs' },
    ]);
  });

  it('PUT /tags/:id updates a tag for an administrator', async () => {
    const response = await request(app.getHttpServer())
      .put('/tags/1')
      .set('Authorization', `Bearer ${await getAdministratorAccessToken()}`)
      .send({ name: 'Updated Backend', slug: 'updated-backend' })
      .expect(200);

    expect(response.body).toMatchObject({ id: 1, name: 'Updated Backend', slug: 'updated-backend' });
  });

  it('DELETE /tags/:id deletes a tag for an administrator', async () => {
    await request(app.getHttpServer())
      .delete('/tags/1')
      .set('Authorization', `Bearer ${await getAdministratorAccessToken()}`)
      .expect(204);

    await request(app.getHttpServer()).get('/tags').expect(200).expect([
      { id: 2, name: 'JavaScript', slug: 'javascript' },
    ]);
  });
});
