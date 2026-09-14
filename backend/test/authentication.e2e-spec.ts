import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { App } from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApplication } from '../src/application-configuration.js';
import { UserRole } from '../src/users/user-role.js';

describe('Authentication endpoint (e2e)', () => {
  let app: INestApplication<App>;
  const user = { email: 'reader@example.com', password: 'development-password' };

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

  it('POST /authentication/register creates a user without exposing its password hash', () => {
    return request(app.getHttpServer())
      .post('/authentication/register')
      .send({ email: 'reader@example.com', password: 'development-password' })
      .expect(201)
      .expect({ id: 1, email: 'reader@example.com', role: UserRole.USER });
  });

  it('POST /authentication/register rejects an invalid email or a short password', async () => {
    await request(app.getHttpServer())
      .post('/authentication/register')
      .send({ email: 'not-an-email', password: 'development-password' })
      .expect(400);

    return request(app.getHttpServer())
      .post('/authentication/register')
      .send({ email: 'reader@example.com', password: 'short' })
      .expect(400);
  });

  it('POST /authentication/register returns 409 for an existing email', async () => {
    await request(app.getHttpServer()).post('/authentication/register').send(user).expect(201);

    return request(app.getHttpServer()).post('/authentication/register').send(user).expect(409);
  });

  it('POST /authentication/login returns an access token for valid credentials', async () => {
    await request(app.getHttpServer()).post('/authentication/register').send(user).expect(201);

    const response = await request(app.getHttpServer())
      .post('/authentication/login')
      .send(user)
      .expect(201);

    expect(response.body.accessToken).toEqual(expect.any(String));
  });

  it('POST /authentication/login sets an HttpOnly refresh token cookie', async () => {
    await request(app.getHttpServer()).post('/authentication/register').send(user).expect(201);

    const response = await request(app.getHttpServer())
      .post('/authentication/login')
      .send(user)
      .expect(201);

    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringMatching(/^refreshToken=.*HttpOnly/)]),
    );

  });

  it('POST /authentication/refresh rotates the refresh token and returns a new access token', async () => {
    await request(app.getHttpServer()).post('/authentication/register').send(user).expect(201);
    const login = await request(app.getHttpServer()).post('/authentication/login').send(user).expect(201);
    const refreshTokenCookie = login.headers['set-cookie'][0];

    const response = await request(app.getHttpServer())
      .post('/authentication/refresh')
      .set('Cookie', refreshTokenCookie)
      .expect(201);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringMatching(/^refreshToken=.*HttpOnly/)]),
    );

    await request(app.getHttpServer())
      .post('/authentication/refresh')
      .set('Cookie', refreshTokenCookie)
      .expect(401);
  });

  it('POST /authentication/logout invalidates the refresh token', async () => {
    await request(app.getHttpServer()).post('/authentication/register').send(user).expect(201);
    const login = await request(app.getHttpServer()).post('/authentication/login').send(user).expect(201);
    const refreshTokenCookie = login.headers['set-cookie'][0];

    await request(app.getHttpServer())
      .post('/authentication/logout')
      .set('Cookie', refreshTokenCookie)
      .expect(204);

    await request(app.getHttpServer())
      .post('/authentication/refresh')
      .set('Cookie', refreshTokenCookie)
      .expect(401);
  });

  it('POST /authentication/login returns 401 for invalid credentials', async () => {
    await request(app.getHttpServer()).post('/authentication/register').send(user).expect(201);

    return request(app.getHttpServer())
      .post('/authentication/login')
      .send({ email: user.email, password: 'wrong-password' })
      .expect(401);
  });

  it('GET /authentication/me returns 401 without a Bearer token', () => {
    return request(app.getHttpServer()).get('/authentication/me').expect(401);
  });

  it('GET /authentication/me returns the authenticated user', async () => {
    await request(app.getHttpServer()).post('/authentication/register').send(user).expect(201);
    const login = await request(app.getHttpServer())
      .post('/authentication/login')
      .send(user)
      .expect(201);

    return request(app.getHttpServer())
      .get('/authentication/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200)
      .expect({ id: 1, email: user.email, role: UserRole.USER });
  });
});
