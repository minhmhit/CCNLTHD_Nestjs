import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface LoginResponseBody {
  accessToken: string;
  user: {
    id: number;
    email: string;
    role: string;
    password?: string;
  };
}

interface RegisterResponseBody {
  id: number;
  email: string;
  password?: string;
}

interface ProfileResponseBody {
  id: number;
  email: string;
  role: string;
}

describe('Authentication & Authorization (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let memberToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Public Endpoints & Authentication', () => {
    it('GET / - should allow unauthenticated access (200 OK)', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Scheduling API is running!');
    });

    it('POST /auth/login - should fail with wrong credentials (401)', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('POST /auth/login - should succeed for admin and return JWT token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'password123',
        })
        .expect(200);

      const body = response.body as LoginResponseBody;
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('user');
      expect(body.user.role).toBe('ADMIN');
      expect(body.user.password).toBeUndefined();

      adminToken = body.accessToken;
    });

    it('POST /auth/login - should succeed for member and return JWT token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'member1@example.com',
          password: 'password123',
        })
        .expect(200);

      const body = response.body as LoginResponseBody;
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('user');
      expect(body.user.role).toBe('MEMBER');

      memberToken = body.accessToken;
    });

    it('POST /auth/register - should create new user', async () => {
      const uniqueEmail = `newuser_${Date.now()}@example.com`;
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: uniqueEmail,
          password: 'Password123!',
          fullName: 'New User',
        })
        .expect(201);

      const body = response.body as RegisterResponseBody;
      expect(body).toHaveProperty('id');
      expect(body.email).toBe(uniqueEmail);
      expect(body.password).toBeUndefined();
    });

    it('POST /auth/register - should reject duplicate email (409 Conflict)', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'admin@example.com',
          password: 'Password123!',
          fullName: 'Duplicate User',
        })
        .expect(409);
    });
  });

  describe('JwtAuthGuard & RolesGuard', () => {
    it('GET /auth/profile - should block unauthenticated request (401 Unauthorized)', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('GET /auth/profile - should allow authenticated request with JWT', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      const body = response.body as ProfileResponseBody;
      expect(body).toHaveProperty('id');
      expect(body.email).toBe('member1@example.com');
      expect(body.role).toBe('MEMBER');
    });

    it('GET /admin-only - should block unauthenticated request (401 Unauthorized)', () => {
      return request(app.getHttpServer())
        .get('/admin-only')
        .expect(401);
    });

    it('GET /admin-only - should reject MEMBER with 403 Forbidden', () => {
      return request(app.getHttpServer())
        .get('/admin-only')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });

    it('GET /admin-only - should allow ADMIN with 200 OK', () => {
      return request(app.getHttpServer())
        .get('/admin-only')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect('Xin chào Admin!');
    });
  });
});
