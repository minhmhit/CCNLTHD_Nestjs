import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import { BookingNotificationJobData } from '../src/notifications/notification.processor';

interface ApiSuccessResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp: string;
}

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
      })
        .overrideProvider(MailerService)
        .useValue({
          sendMail: jest.fn().mockResolvedValue(true),
        })
        .compile();

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
    it('GET / - should allow unauthenticated access (200 OK wrapped in success format)', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .expect(200);

      const body =
        response.body as ApiSuccessResponse<string>;
      expect(body.success).toBe(true);
      expect(body.statusCode).toBe(200);
      expect(body.data).toBe('Scheduling API is running!');
      expect(body).toHaveProperty('timestamp');
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

      const body =
        response.body as ApiSuccessResponse<LoginResponseBody>;
      expect(body.success).toBe(true);
      expect(body.statusCode).toBe(200);
      expect(body.data).toHaveProperty('accessToken');
      expect(body.data).toHaveProperty('refreshToken');
      expect(body.data).toHaveProperty('user');
      expect(body.data.user.role).toBe('ADMIN');
      expect(body.data.user.password).toBeUndefined();
      expect(body.data.user.refreshToken).toBeUndefined();

      adminToken = body.data.accessToken;
    });

    it('POST /auth/login - should succeed for member and return accessToken & refreshToken', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'member1@example.com',
          password: 'password123',
        })
        .expect(200);

      const body =
        response.body as ApiSuccessResponse<LoginResponseBody>;
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('accessToken');
      expect(body.data).toHaveProperty('refreshToken');
      expect(body.data).toHaveProperty('user');
      expect(body.data.user.role).toBe('MEMBER');

      memberToken = body.data.accessToken;
      memberRefreshToken = body.data.refreshToken;
    });

    it('POST /auth/refresh - should issue new tokens with valid refreshToken', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: memberRefreshToken,
        })
        .expect(200);

      const body =
        response.body as ApiSuccessResponse<LoginResponseBody>;
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('accessToken');
      expect(body.data).toHaveProperty('refreshToken');
      expect(body.data.user.email).toBe(
        'member1@example.com',
      );

      // Cập nhật lại token mới sau khi rotate
      memberToken = body.data.accessToken;
      memberRefreshToken = body.data.refreshToken;
    });

    it('POST /auth/refresh - should reject invalid refreshToken (401)', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid_or_tampered_token',
        })
        .expect(401);
    });

    it('POST /auth/register - should create new user and return wrapped response', async () => {
      const uniqueEmail = `newuser_${Date.now()}@example.com`;
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: uniqueEmail,
          password: 'Password123!',
          fullName: 'New User',
        })
        .expect(201);

      const body =
        response.body as ApiSuccessResponse<RegisterResponseBody>;
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('user');
      expect(body.data.user.email).toBe(uniqueEmail);
      expect(body.data.user.password).toBeUndefined();
      expect(body.data.user.refreshToken).toBeUndefined();
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

      const body =
        response.body as ApiSuccessResponse<ProfileResponseBody>;
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('id');
      expect(body.data.email).toBe('member1@example.com');
      expect(body.data.role).toBe('MEMBER');
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

    it('GET /admin-only - should allow ADMIN with 200 OK wrapped in success format', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin-only')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body =
        response.body as ApiSuccessResponse<string>;
      expect(body.success).toBe(true);
      expect(body.data).toBe('Xin chào Admin!');
    });

    it('POST /auth/logout - should successfully revoke refreshToken in DB', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      const body = response.body as ApiSuccessResponse<{
        message: string;
      }>;
      expect(body.success).toBe(true);
      expect(body.data.message).toBe(
        'Đăng xuất thành công!',
      );

      // Sau khi logout, gửi refreshToken cũ phải bị từ chối 401
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: memberRefreshToken,
        })
        .expect(401);
    });
  });

  describe('ResourcesModule CRUD & RBAC', () => {
    let createdResourceId: number;

    it('GET /resources - should allow authenticated users to list resources', async () => {
      const response = await request(app.getHttpServer())
        .get('/resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as ApiSuccessResponse<{
        items: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.items)).toBe(true);
      expect(body.data.items.length).toBeGreaterThan(0);
    });

    it('POST /resources - should reject MEMBER with 403 Forbidden', () => {
      return request(app.getHttpServer())
        .post('/resources')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'Phòng Họp Không Hợp Lệ',
          capacity: 10,
        })
        .expect(403);
    });

    it('POST /resources - should allow ADMIN to create resource (201 Created)', async () => {
      const uniqueName = `Phòng Họp Test ${Date.now()}`;
      const response = await request(app.getHttpServer())
        .post('/resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: uniqueName,
          capacity: 25,
          isActive: true,
        })
        .expect(201);

      const body = response.body as ApiSuccessResponse<{
        id: number;
        name: string;
        capacity: number;
        isActive: boolean;
      }>;
      expect(body.success).toBe(true);
      expect(body.data.name).toBe(uniqueName);
      expect(body.data.capacity).toBe(25);
      createdResourceId = body.data.id;
    });

    it('PATCH /resources/:id - should allow ADMIN to update resource', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/resources/${createdResourceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          capacity: 35,
        })
        .expect(200);

      const body = response.body as ApiSuccessResponse<{
        id: number;
        capacity: number;
      }>;
      expect(body.success).toBe(true);
      expect(body.data.capacity).toBe(35);
    });

    it('DELETE /resources/:id - should reject MEMBER with 403 Forbidden', () => {
      return request(app.getHttpServer())
        .delete(`/resources/${createdResourceId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });

    it('DELETE /resources/:id - should allow ADMIN to remove resource', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/resources/${createdResourceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as ApiSuccessResponse<{
        message: string;
      }>;
      expect(body.success).toBe(true);
      expect(body.data.message).toContain('thành công');
    });
  });

  describe('SchedulesModule Validation & Time Constraints', () => {
    let validationResourceId: number;

    beforeAll(async () => {
      const roomRes = await request(app.getHttpServer())
        .post('/resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Phòng Test Validation ${Date.now()}`,
          capacity: 20,
          isActive: true,
        });
      validationResourceId = (
        roomRes.body as ApiSuccessResponse<{ id: number }>
      ).data.id;
    });

    it('POST /schedules - should reject when endTime is before startTime (400 Bad Request)', async () => {
      const futureStart = new Date(
        Date.now() + 2 * 60 * 60 * 1000,
      ).toISOString();
      const earlierEnd = new Date(
        Date.now() + 1 * 60 * 60 * 1000,
      ).toISOString();

      const response = await request(app.getHttpServer())
        .post('/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Họp Khẩn Cấp',
          resourceId: validationResourceId,
          startTime: futureStart,
          endTime: earlierEnd,
        })
        .expect(400);

      const errorBody1 = response.body as {
        success: boolean;
        message: string[];
      };
      expect(errorBody1.success).toBe(false);
      expect(errorBody1.message).toContain(
        'endTime phải sau startTime',
      );
    });

    it('POST /schedules - should reject when startTime is in the past (400 Bad Request)', async () => {
      const pastStart = new Date(
        Date.now() - 24 * 60 * 60 * 1000,
      ).toISOString();
      const futureEnd = new Date(
        Date.now() + 1 * 60 * 60 * 1000,
      ).toISOString();

      const response = await request(app.getHttpServer())
        .post('/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Lịch Trong Quá Khứ',
          resourceId: validationResourceId,
          startTime: pastStart,
          endTime: futureEnd,
        })
        .expect(400);

      const errorBody2 = response.body as {
        success: boolean;
        message: string[];
      };
      expect(errorBody2.success).toBe(false);
      expect(errorBody2.message).toContain(
        'startTime phải lớn hơn hoặc bằng thời điểm hiện tại',
      );
    });

    it('POST /schedules - should reject unwhitelisted fields (400 Bad Request via forbidNonWhitelisted)', async () => {
      const futureStart = new Date(
        Date.now() + 1 * 60 * 60 * 1000,
      ).toISOString();
      const futureEnd = new Date(
        Date.now() + 2 * 60 * 60 * 1000,
      ).toISOString();

      const response = await request(app.getHttpServer())
        .post('/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Họp Hợp Lệ Có Trường Lạ',
          resourceId: validationResourceId,
          startTime: futureStart,
          endTime: futureEnd,
          hackerField: 'injection_attack',
        })
        .expect(400);

      const errorBody3 = response.body as {
        success: boolean;
        message: string;
      };
      expect(errorBody3.success).toBe(false);
      expect(errorBody3.message).toContain(
        'property hackerField should not exist',
      );
    });

    it('POST /schedules - should create schedule when data is fully valid (201 Created)', async () => {
      const futureStart = new Date(
        Date.now() + 3 * 60 * 60 * 1000,
      ).toISOString();
      const futureEnd = new Date(
        Date.now() + 4 * 60 * 60 * 1000,
      ).toISOString();

      const response = await request(app.getHttpServer())
        .post('/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Họp Chiến Lược Q1',
          description: 'Họp chiến lược ban lãnh đạo',
          resourceId: validationResourceId,
          startTime: futureStart,
          endTime: futureEnd,
        })
        .expect(201);

      const body = response.body as ApiSuccessResponse<{
        id: number;
        title: string;
      }>;
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('Họp Chiến Lược Q1');
    });

    it('GET /schedules - should support pagination with QueryScheduleDto', async () => {
      const response = await request(app.getHttpServer())
        .get('/schedules?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as ApiSuccessResponse<{
        items: any[];
        total: number;
        page: number;
        limit: number;
      }>;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.items)).toBe(true);
      expect(body.data.page).toBe(1);
      expect(body.data.limit).toBe(5);
    });
  });

  describe('Step 5: Transaction Overlap Prevention & Ownership Guard', () => {
    let member1Token: string;
    let member2Token: string;
    let testResourceId: number;
    let createdScheduleId: number;

    beforeAll(async () => {
      // Đăng nhập Member 1 (User A)
      const res1 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'member1@example.com',
          password: 'password123',
        });
      member1Token = (
        res1.body as ApiSuccessResponse<LoginResponseBody>
      ).data.accessToken;

      // Đăng nhập Member 2 (User B)
      const res2 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'member2@example.com',
          password: 'password123',
        });
      member2Token = (
        res2.body as ApiSuccessResponse<LoginResponseBody>
      ).data.accessToken;

      // Admin tạo phòng họp riêng biệt để test độc lập không phụ thuộc dữ liệu seed
      const roomRes = await request(app.getHttpServer())
        .post('/resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Phòng Test Overlap ${Date.now()}`,
          capacity: 15,
          isActive: true,
        })
        .expect(201);
      testResourceId = (
        roomRes.body as ApiSuccessResponse<{ id: number }>
      ).data.id;
    });

    it('5.1 Overlap - should reject creating schedule on non-existent resource (404 Not Found)', async () => {
      const startTime = new Date(
        Date.now() + 10 * 60 * 60 * 1000,
      ).toISOString();
      const endTime = new Date(
        Date.now() + 11 * 60 * 60 * 1000,
      ).toISOString();

      const response = await request(app.getHttpServer())
        .post('/schedules')
        .set('Authorization', `Bearer ${member1Token}`)
        .send({
          title: 'Lịch trên phòng không tồn tại',
          resourceId: 999999,
          startTime,
          endTime,
        })
        .expect(404);

      const body = response.body as {
        success: boolean;
        message: string;
      };
      expect(body.success).toBe(false);
      expect(body.message).toContain(
        'Tài nguyên phòng họp không tồn tại',
      );
    });

    it('5.1 Overlap - should create schedule from 09:00 to 10:00 successfully', async () => {
      const startTime = new Date(
        Date.now() + 10 * 60 * 60 * 1000,
      ).toISOString();
      const endTime = new Date(
        Date.now() + 11 * 60 * 60 * 1000,
      ).toISOString();

      const response = await request(app.getHttpServer())
        .post('/schedules')
        .set('Authorization', `Bearer ${member1Token}`)
        .send({
          title: 'Họp Dự Án Sprint A',
          resourceId: testResourceId,
          startTime,
          endTime,
        })
        .expect(201);

      const body = response.body as ApiSuccessResponse<{
        id: number;
        title: string;
        resourceId: number;
        userId: number;
        status: string;
      }>;
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('Họp Dự Án Sprint A');
      expect(body.data.status).toBe('CONFIRMED');
      createdScheduleId = body.data.id;
    });

    it('5.1 Overlap - should block second user booking overlapping time slot (09:30 - 10:30) with 409 Conflict', async () => {
      // Khung giờ overlap (chồng lấn từ 10h30 đến 11h30 trong khi lịch trước là 10h00 - 11h00)
      const overlapStart = new Date(
        Date.now() + 10.5 * 60 * 60 * 1000,
      ).toISOString();
      const overlapEnd = new Date(
        Date.now() + 11.5 * 60 * 60 * 1000,
      ).toISOString();

      const response = await request(app.getHttpServer())
        .post('/schedules')
        .set('Authorization', `Bearer ${member2Token}`)
        .send({
          title: 'Họp Trùng Lấn Ban Thiết Kế',
          resourceId: testResourceId,
          startTime: overlapStart,
          endTime: overlapEnd,
        })
        .expect(409);

      const body = response.body as {
        success: boolean;
        statusCode: number;
        message: string;
      };
      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(409);
      expect(body.message).toBe(
        'Phòng họp đã được đặt trong khung giờ này. Vui lòng chọn thời gian khác!',
      );
    });

    it('5.1 Rollback - should rollback transaction completely when simulated error occurs after insert', async () => {
      const rollbackStart = new Date(
        Date.now() + 15 * 60 * 60 * 1000,
      ).toISOString();
      const rollbackEnd = new Date(
        Date.now() + 16 * 60 * 60 * 1000,
      ).toISOString();

      // Gửi request tới endpoint test-rollback
      const response = await request(app.getHttpServer())
        .post('/schedules/test-rollback')
        .set('Authorization', `Bearer ${member1Token}`)
        .send({
          title: 'Lịch Hẹn Cần Rollback',
          resourceId: testResourceId,
          startTime: rollbackStart,
          endTime: rollbackEnd,
        })
        .expect(500);

      const errBody = response.body as {
        success: boolean;
        message: string;
      };
      expect(errBody.success).toBe(false);
      expect(errBody.message).toContain(
        'Transaction tự động Rollback',
      );

      // Xác minh DB không có lịch hẹn rác nào được lưu lại trong khung giờ này
      const checkRes = await request(app.getHttpServer())
        .get(
          `/schedules?resourceId=${testResourceId}&from=${rollbackStart}&to=${rollbackEnd}`,
        )
        .set('Authorization', `Bearer ${member1Token}`)
        .expect(200);

      const checkBody =
        checkRes.body as ApiSuccessResponse<{
          items: any[];
          total: number;
        }>;
      expect(checkBody.data.total).toBe(0);
      expect(checkBody.data.items.length).toBe(0);
    });

    it('5.2 Ownership - User B should be blocked (403 Forbidden) when updating User A schedule', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/schedules/${createdScheduleId}`)
        .set('Authorization', `Bearer ${member2Token}`)
        .send({
          title: 'User B Cố Tình Chiếm Quyền Sửa',
        })
        .expect(403);

      const body = response.body as {
        success: boolean;
        statusCode: number;
        message: string;
      };
      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(403);
      expect(body.message).toBe(
        'Bạn không có quyền chỉnh sửa hoặc hủy lịch hẹn của người khác!',
      );
    });

    it('5.2 Ownership - User B should be blocked (403 Forbidden) when deleting User A schedule', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/schedules/${createdScheduleId}`)
        .set('Authorization', `Bearer ${member2Token}`)
        .expect(403);

      const body = response.body as {
        success: boolean;
        statusCode: number;
        message: string;
      };
      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(403);
      expect(body.message).toBe(
        'Bạn không có quyền chỉnh sửa hoặc hủy lịch hẹn của người khác!',
      );
    });

    it('5.2 Ownership - User A should successfully cancel their own schedule (status changes to CANCELLED)', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/schedules/${createdScheduleId}`)
        .set('Authorization', `Bearer ${member1Token}`)
        .expect(200);

      const body = response.body as ApiSuccessResponse<{
        id: number;
        status: string;
      }>;
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(createdScheduleId);
      expect(body.data.status).toBe('CANCELLED');
    });

    it('5.2 Ownership - User B can now book the cancelled time slot (freed slot)', async () => {
      // Khung giờ lúc trước bị chặn, giờ đã được giải phóng vì User A đã CANCELLED
      const startTime = new Date(
        Date.now() + 10 * 60 * 60 * 1000,
      ).toISOString();
      const endTime = new Date(
        Date.now() + 11 * 60 * 60 * 1000,
      ).toISOString();

      const response = await request(app.getHttpServer())
        .post('/schedules')
        .set('Authorization', `Bearer ${member2Token}`)
        .send({
          title: 'User B Đặt Lại Sau Khi User A Hủy',
          resourceId: testResourceId,
          startTime,
          endTime,
        })
        .expect(201);

      const body = response.body as ApiSuccessResponse<{
        id: number;
        title: string;
        status: string;
      }>;
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('CONFIRMED');
    });

    it('5.2 Ownership - Admin can cancel any user schedule successfully', async () => {
      // User B tạo lịch mới
      const startTime = new Date(
        Date.now() + 20 * 60 * 60 * 1000,
      ).toISOString();
      const endTime = new Date(
        Date.now() + 21 * 60 * 60 * 1000,
      ).toISOString();

      const createRes = await request(app.getHttpServer())
        .post('/schedules')
        .set('Authorization', `Bearer ${member2Token}`)
        .send({
          title: 'Lịch Của User B Sắp Bị Admin Hủy',
          resourceId: testResourceId,
          startTime,
          endTime,
        })
        .expect(201);

      const scheduleId = (
        createRes.body as ApiSuccessResponse<{ id: number }>
      ).data.id;

      // Admin hủy lịch của User B
      const deleteRes = await request(app.getHttpServer())
        .delete(`/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const deleteBody =
        deleteRes.body as ApiSuccessResponse<{
          id: number;
          status: string;
        }>;
      expect(deleteBody.success).toBe(true);
      expect(deleteBody.data.status).toBe('CANCELLED');
    });
  });

  describe('Step 6: Cross-Cutting Standards (Logging, Interceptor & Filter)', () => {
    it('6.1 RequestId - should attach X-Request-Id header to every response', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .expect(200);

      expect(response.headers).toHaveProperty(
        'x-request-id',
      );
      expect(typeof response.headers['x-request-id']).toBe(
        'string',
      );
      expect(
        response.headers['x-request-id'].length,
      ).toBeGreaterThan(0);
    });

    it('6.2 Filter - 404 Not Found should have standardized error format with requestId and errorCode', async () => {
      const response = await request(app.getHttpServer())
        .get('/resources/9999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.headers).toHaveProperty(
        'x-request-id',
      );
      const body = response.body as {
        success: boolean;
        statusCode: number;
        errorCode: string;
        message: string;
        requestId: string;
        timestamp: string;
        path: string;
      };
      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(404);
      expect(body.errorCode).toBe('NOT_FOUND');
      expect(body.requestId).toBe(
        response.headers['x-request-id'],
      );
      expect(body).toHaveProperty('timestamp');
      expect(body.path).toBe('/resources/9999999');
    });

    it('6.2 Filter - 401 Unauthorized should have standardized error format', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);

      expect(response.headers).toHaveProperty(
        'x-request-id',
      );
      const body = response.body as {
        success: boolean;
        statusCode: number;
        errorCode: string;
        requestId: string;
      };
      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(401);
      expect(body.errorCode).toBe('UNAUTHORIZED');
      expect(body.requestId).toBe(
        response.headers['x-request-id'],
      );
    });

    it('6.2 Filter - 400 Validation Error should have standardized error format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'not-an-email',
          password: 'short',
        })
        .expect(400);

      expect(response.headers).toHaveProperty(
        'x-request-id',
      );
      const body = response.body as {
        success: boolean;
        statusCode: number;
        errorCode: string;
        message: string | string[];
        requestId: string;
      };
      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(400);
      expect(body.errorCode).toBe('BAD_REQUEST');
      expect(body.requestId).toBe(
        response.headers['x-request-id'],
      );
    });

    it('6.2 Transform - Success response should be strictly wrapped in { success, statusCode, data, timestamp }', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .expect(200);

      const body = response.body as {
        success: boolean;
        statusCode: number;
        data: unknown;
        timestamp: string;
      };
      expect(body.success).toBe(true);
      expect(body.statusCode).toBe(200);
      expect(body.data).toBe('Scheduling API is running!');
      expect(body).toHaveProperty('timestamp');
    });
  });

  describe('Step 8: Concurrency Locking with Pessimistic Write Lock', () => {
    let concurrencyResourceId: number;
    const tokens: string[] = [];

    beforeAll(async () => {
      // 1. Tạo 1 phòng họp test độc lập
      const roomRes = await request(app.getHttpServer())
        .post('/resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Phòng Test Concurrency ${Date.now()}`,
          capacity: 30,
          isActive: true,
        })
        .expect(201);

      concurrencyResourceId = (
        roomRes.body as ApiSuccessResponse<{ id: number }>
      ).data.id;

      // 2. Thu thập 10 tokens độc lập (admin + member1 + member2 + 7 users mới)
      tokens.push(adminToken);

      const m1Res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'member1@example.com',
          password: 'password123',
        })
        .expect(200);
      tokens.push(
        (
          m1Res.body as ApiSuccessResponse<LoginResponseBody>
        ).data.accessToken,
      );

      const m2Res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'member2@example.com',
          password: 'password123',
        })
        .expect(200);
      tokens.push(
        (
          m2Res.body as ApiSuccessResponse<LoginResponseBody>
        ).data.accessToken,
      );

      for (let i = 1; i <= 7; i++) {
        const email = `concurrency_user_${Date.now()}_${i}@example.com`;
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email,
            password: 'Password123!',
            fullName: `Concurrent User ${i}`,
          })
          .expect(201);

        const loginRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email,
            password: 'Password123!',
          })
          .expect(200);

        tokens.push(
          (
            loginRes.body as ApiSuccessResponse<LoginResponseBody>
          ).data.accessToken,
        );
      }
    });

    it('8.2 Concurrency - 10 simultaneous requests booking the same room & time: exactly 1 succeeds (201) and 9 blocked (409)', async () => {
      const fixedStartTime = new Date(
        Date.now() + 48 * 60 * 60 * 1000,
      ).toISOString();
      const fixedEndTime = new Date(
        Date.now() + 49 * 60 * 60 * 1000,
      ).toISOString();

      // Gửi đồng thời 10 request đặt lịch bằng Promise.all với CÙNG một khung giờ trên cùng phòng đó bằng các token khác nhau
      const requests = tokens.map((token, index) =>
        request(app.getHttpServer())
          .post('/schedules')
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: `Đặt lịch tranh chấp đồng thời #${index + 1}`,
            resourceId: concurrencyResourceId,
            startTime: fixedStartTime,
            endTime: fixedEndTime,
          }),
      );

      const responses = await Promise.all(requests);

      // Đếm số lượng response có status 201 Created: BẮT BUỘC chỉ đúng 1 request thành công
      const successResponses = responses.filter(
        (res) => res.status === 201,
      );
      expect(successResponses.length).toBe(1);

      // Đếm số lượng response có status 409 Conflict: BẮT BUỘC đúng 9 request bị chặn
      const conflictResponses = responses.filter(
        (res) => res.status === 409,
      );
      expect(conflictResponses.length).toBe(9);

      // Kiểm tra response lỗi đều theo chuẩn
      conflictResponses.forEach((res) => {
        const body = res.body as {
          success: boolean;
          statusCode: number;
          message: string;
        };
        expect(body.success).toBe(false);
        expect(body.statusCode).toBe(409);
        expect(body.message).toContain(
          'Phòng họp đã được đặt trong khung giờ này. Vui lòng chọn thời gian khác!',
        );
      });

      // Truy vấn CSDL xác minh: Bảng schedules trong khung giờ đó chỉ tồn tại ĐÚNG 1 bản ghi duy nhất, không có phantom read hoặc duplicate schedule
      const verifyRes = await request(app.getHttpServer())
        .get(
          `/schedules?resourceId=${concurrencyResourceId}&from=${fixedStartTime}&to=${fixedEndTime}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const verifyBody =
        verifyRes.body as ApiSuccessResponse<{
          items: Array<{
            id: number;
            resourceId: number;
            status: string;
          }>;
          total: number;
        }>;
      expect(verifyBody.data.total).toBe(1);
      expect(verifyBody.data.items.length).toBe(1);
      expect(verifyBody.data.items[0].resourceId).toBe(
        concurrencyResourceId,
      );
      expect(verifyBody.data.items[0].status).toBe(
        'CONFIRMED',
      );
    });
  });

  describe('Step 9: Redis Cache-Aside & Cache Invalidation', () => {
    let testRoomId: number;

    beforeAll(async () => {
      // Lấy phòng họp đầu tiên có sẵn trong danh sách (đảm bảo luôn nằm trong page 1)
      const listRes = await request(app.getHttpServer())
        .get('/resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const listBody = listRes.body as ApiSuccessResponse<{
        items: Array<{ id: number; capacity: number }>;
      }>;
      testRoomId = listBody.data.items[0].id;

      // Đặt sức chứa ban đầu về 20
      await request(app.getHttpServer())
        .patch(`/resources/${testRoomId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ capacity: 20 })
        .expect(200);
    });

    it('9.1 Cache-Aside - should cache GET /resources on first call (Cache MISS) and serve from Redis on subsequent call (Cache HIT)', async () => {
      // Lần 1: Cache MISS -> query TypeORM và nạp vào Redis
      const firstRes = await request(app.getHttpServer())
        .get('/resources')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      const firstBody =
        firstRes.body as ApiSuccessResponse<{
          items: Array<{ id: number; capacity: number }>;
        }>;
      const initialRoom = firstBody.data.items.find(
        (r) => r.id === testRoomId,
      );
      expect(initialRoom).toBeDefined();
      expect(initialRoom?.capacity).toBe(20);

      // Lần 2: Cache HIT -> lấy trực tiếp từ Redis
      const secondRes = await request(app.getHttpServer())
        .get('/resources')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      const secondBody =
        secondRes.body as ApiSuccessResponse<{
          items: Array<{ id: number; capacity: number }>;
        }>;
      const cachedRoom = secondBody.data.items.find(
        (r) => r.id === testRoomId,
      );
      expect(cachedRoom).toBeDefined();
      expect(cachedRoom?.capacity).toBe(20);
    });

    it('9.2 Cache Invalidation - Admin PATCH /resources/:id should purge cache and prevent stale data', async () => {
      // Bước 1: Gọi GET /resources để đảm bảo dữ liệu được cache vào Redis
      const getResBefore = await request(
        app.getHttpServer(),
      )
        .get('/resources')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      const bodyBefore =
        getResBefore.body as ApiSuccessResponse<{
          items: Array<{ id: number; capacity: number }>;
        }>;
      const roomBefore = bodyBefore.data.items.find(
        (r) => r.id === testRoomId,
      );
      expect(roomBefore?.capacity).toBe(20);

      // Bước 2: Admin gọi PATCH /resources/:id sửa sức chứa phòng từ 20 thành 50
      const patchRes = await request(app.getHttpServer())
        .patch(`/resources/${testRoomId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          capacity: 50,
        })
        .expect(200);

      const patchBody =
        patchRes.body as ApiSuccessResponse<{
          id: number;
          capacity: number;
        }>;
      expect(patchBody.data.capacity).toBe(50);

      // Bước 3: Gọi lại GET /resources ngay lập tức -> Xác nhận dữ liệu trả về cập nhật sức chứa mới là 50
      // (Chứng minh cache cũ đã bị xóa, không bị lỗi Stale Data)
      const getResAfter = await request(app.getHttpServer())
        .get('/resources')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      const bodyAfter =
        getResAfter.body as ApiSuccessResponse<{
          items: Array<{ id: number; capacity: number }>;
        }>;
      const roomAfter = bodyAfter.data.items.find(
        (r) => r.id === testRoomId,
      );
      expect(roomAfter).toBeDefined();
      expect(roomAfter?.capacity).toBe(50);
    });
  });

  describe('Step 10: Background Queue & BullMQ Notifications', () => {
    let queueResourceId: number;

    beforeAll(async () => {
      const roomRes = await request(app.getHttpServer())
        .post('/resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Phòng Test BullMQ ${Date.now()}`,
          capacity: 15,
          isActive: true,
        })
        .expect(201);

      queueResourceId = (
        roomRes.body as ApiSuccessResponse<{ id: number }>
      ).data.id;
    });

    it('10.1 Background Queue - Booking pushes job into BullMQ and processes asynchronously without blocking HTTP response', async () => {
      const startTime = new Date(
        Date.now() + 80 * 60 * 60 * 1000,
      ).toISOString();
      const endTime = new Date(
        Date.now() + 81 * 60 * 60 * 1000,
      ).toISOString();

      const startTimeMs = Date.now();
      const response = await request(app.getHttpServer())
        .post('/schedules')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Họp Kiểm Thử BullMQ Background Queue',
          resourceId: queueResourceId,
          startTime,
          endTime,
        })
        .expect(201);
      const durationMs = Date.now() - startTimeMs;

      // API phản hồi cực nhanh vì không bị nghẽn bởi tác vụ gửi thông báo
      expect(durationMs).toBeLessThan(1000);

      const body = response.body as ApiSuccessResponse<{
        id: number;
        title: string;
        status: string;
      }>;
      expect(body.success).toBe(true);
      expect(body.data.id).toBeDefined();

      // Kiểm tra Queue có job tương ứng với idempotency key
      const queue = app.get<
        Queue<BookingNotificationJobData>
      >(getQueueToken('booking-notification'));
      const job:
        Job<BookingNotificationJobData> | undefined =
        await queue.getJob(`schedule_${body.data.id}`);
      expect(job).toBeDefined();
      expect(job?.data.scheduleId).toBe(body.data.id);
      expect(job?.data.email).toBeDefined();
      expect(job?.opts.attempts).toBe(3);
      expect(job?.opts.backoff).toEqual({
        type: 'exponential',
        delay: 2000,
      });
    });
  });

  describe('Step 13: System Health Checks (@nestjs/terminus)', () => {
    it('GET /health - should allow unauthenticated access (@Public) and return status ok with database, redis, memory indicators', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      const body = response.body as {
        status: string;
        info: {
          database?: { status: string };
          redis?: { status: string };
          memory_heap?: { status: string };
          memory_rss?: { status: string };
        };
        success?: boolean;
      };

      expect(body.status).toBe('ok');
      expect(body.info).toBeDefined();
      expect(body.info.database?.status).toBe('up');
      expect(body.info.redis?.status).toBe('up');
      expect(body.info.memory_heap?.status).toBe('up');
      expect(body.info.memory_rss?.status).toBe('up');
    });
  });
});
