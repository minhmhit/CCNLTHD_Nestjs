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
  refreshToken: string;
  user: {
    id: number;
    email: string;
    role: string;
    password?: string;
    refreshToken?: string;
  };
}

interface RegisterResponseBody {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    role: string;
    password?: string;
    refreshToken?: string;
  };
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
  let memberRefreshToken: string;

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

    it('POST /auth/login - should succeed for admin and return both accessToken & refreshToken', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'password123',
        })
        .expect(200);

      const body = response.body as LoginResponseBody;
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
      expect(body).toHaveProperty('user');
      expect(body.user.role).toBe('ADMIN');
      expect(body.user.password).toBeUndefined();
      expect(body.user.refreshToken).toBeUndefined();

      adminToken = body.accessToken;
    });

    it('POST /auth/login - should succeed for member and return accessToken & refreshToken', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'member1@example.com',
          password: 'password123',
        })
        .expect(200);

      const body = response.body as LoginResponseBody;
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
      expect(body).toHaveProperty('user');
      expect(body.user.role).toBe('MEMBER');

      memberToken = body.accessToken;
      memberRefreshToken = body.refreshToken;
    });

    it('POST /auth/refresh - should issue new tokens with valid refreshToken', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: memberRefreshToken,
        })
        .expect(200);

      const body = response.body as LoginResponseBody;
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
      expect(body.user.email).toBe('member1@example.com');

      // Cập nhật lại token mới sau khi rotate
      memberToken = body.accessToken;
      memberRefreshToken = body.refreshToken;
    });

    it('POST /auth/refresh - should reject invalid refreshToken (401)', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid_or_tampered_token',
        })
        .expect(401);
    });

    it('POST /auth/register - should create new user and return full tokens', async () => {
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
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
      expect(body).toHaveProperty('user');
      expect(body.user.email).toBe(uniqueEmail);
      expect(body.user.password).toBeUndefined();
      expect(body.user.refreshToken).toBeUndefined();
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

  describe('JwtAuthGuard, RolesGuard & Logout (Blacklist/Revocation)', () => {
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

    it('POST /auth/logout - should successfully revoke refreshToken in DB', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200)
        .expect({ message: 'Đăng xuất thành công!' });

      // Sau khi logout, gửi refreshToken cũ phải bị từ chối 401
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: memberRefreshToken,
        })
        .expect(401);
    });
  });
});
