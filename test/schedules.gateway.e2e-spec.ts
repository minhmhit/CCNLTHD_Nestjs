import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  io,
  Socket as ClientSocket,
} from 'socket.io-client';
import { AddressInfo } from 'net';
import { Server } from 'http';
import { AppModule } from '../src/app.module';

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
  };
}

describe('SchedulesGateway (e2e - Realtime WebSocket)', () => {
  let app: INestApplication<App>;
  let port: number;
  let adminToken: string;
  let member1Token: string;
  let member2Token: string;
  let testResourceId: number;
  let createdScheduleId: number;

  let clientA: ClientSocket;
  let clientB: ClientSocket;

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

    // Lắng nghe trên cổng ngẫu nhiên khả dụng (ephemeral port)
    await app.listen(0);
    const httpServer =
      app.getHttpServer() as unknown as Server;
    const address = httpServer.address() as AddressInfo;
    port = address.port;

    // Đăng nhập Admin
    const adminLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123',
      })
      .expect(200);
    adminToken = (
      adminLoginRes.body as ApiSuccessResponse<LoginResponseBody>
    ).data.accessToken;

    // Đăng nhập Member 1 (Client A)
    const m1Res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'member1@example.com',
        password: 'password123',
      })
      .expect(200);
    member1Token = (
      m1Res.body as ApiSuccessResponse<LoginResponseBody>
    ).data.accessToken;

    // Đăng nhập Member 2 (Client B)
    const m2Res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'member2@example.com',
        password: 'password123',
      })
      .expect(200);
    member2Token = (
      m2Res.body as ApiSuccessResponse<LoginResponseBody>
    ).data.accessToken;

    // Admin tạo phòng họp mới để kiểm thử Realtime
    const resourceRes = await request(app.getHttpServer())
      .post('/resources')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Phòng Realtime Test ${Date.now()}`,
        capacity: 25,
        isActive: true,
      })
      .expect(201);

    testResourceId = (
      resourceRes.body as ApiSuccessResponse<{ id: number }>
    ).data.id;
  });

  afterAll(async () => {
    if (clientA && clientA.connected) {
      clientA.disconnect();
    }
    if (clientB && clientB.connected) {
      clientB.disconnect();
    }
    await app.close();
  });

  describe('WebSocket Authentication & Connection Guards', () => {
    it('should reject connection when JWT token is missing', async () => {
      const socket = io(
        `http://localhost:${port}/schedules`,
        {
          transports: ['websocket'],
          forceNew: true,
        },
      );

      await new Promise<void>((resolve) => {
        socket.on('disconnect', () => {
          resolve();
        });
        socket.on('connect_error', () => {
          resolve();
        });
      });

      expect(socket.connected).toBe(false);
      socket.disconnect();
    });

    it('should reject connection when JWT token is invalid', async () => {
      const socket = io(
        `http://localhost:${port}/schedules`,
        {
          auth: { token: 'invalid.jwt.token' },
          transports: ['websocket'],
          forceNew: true,
        },
      );

      await new Promise<void>((resolve) => {
        socket.on('disconnect', () => {
          resolve();
        });
        socket.on('connect_error', () => {
          resolve();
        });
      });

      expect(socket.connected).toBe(false);
      socket.disconnect();
    });

    it('should allow connection when valid JWT token is provided', async () => {
      const socket = io(
        `http://localhost:${port}/schedules`,
        {
          auth: { token: `Bearer ${member1Token}` },
          transports: ['websocket'],
          forceNew: true,
        },
      );

      await new Promise<void>((resolve, reject) => {
        socket.on('connect', () => {
          resolve();
        });
        socket.on('connect_error', (err) => {
          reject(err);
        });
      });

      expect(socket.connected).toBe(true);
      socket.disconnect();
    });
  });

  describe('Realtime Scheduling Synchronization (Room Broadcast)', () => {
    it('Client A & Client B should connect and join room successfully', async () => {
      // Kết nối Client A
      clientA = io(`http://localhost:${port}/schedules`, {
        auth: { token: `Bearer ${member1Token}` },
        transports: ['websocket'],
        forceNew: true,
      });

      // Kết nối Client B
      clientB = io(`http://localhost:${port}/schedules`, {
        auth: { token: member2Token },
        transports: ['websocket'],
        forceNew: true,
      });

      await Promise.all([
        new Promise<void>((resolve, reject) => {
          clientA.on('connect', () => resolve());
          clientA.on('connect_error', reject);
        }),
        new Promise<void>((resolve, reject) => {
          clientB.on('connect', () => resolve());
          clientB.on('connect_error', reject);
        }),
      ]);

      expect(clientA.connected).toBe(true);
      expect(clientB.connected).toBe(true);

      // Cả hai client cùng join vào room của phòng họp testResourceId
      clientA.emit('joinRoom', {
        resourceId: testResourceId,
      });
      clientB.emit('joinRoom', {
        resourceId: testResourceId,
      });

      // Đợi ngắn để socket server hoàn tất đăng ký room
      await new Promise((resolve) =>
        setTimeout(resolve, 100),
      );
    });

    it('Client A creates schedule -> Client B receives "scheduleCreated" event in real-time', async () => {
      const startTime = new Date(
        Date.now() + 100 * 60 * 60 * 1000,
      ).toISOString();
      const endTime = new Date(
        Date.now() + 101 * 60 * 60 * 1000,
      ).toISOString();

      // Đăng ký listener trên Client B để hứng sự kiện realtime
      const eventPromise = new Promise<{
        id: number;
        title: string;
        resourceId: number;
      }>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(
            new Error(
              'Timeout: Client B không nhận được sự kiện scheduleCreated!',
            ),
          );
        }, 3000);

        clientB.once('scheduleCreated', (payload) => {
          clearTimeout(timeout);
          resolve(
            payload as {
              id: number;
              title: string;
              resourceId: number;
            },
          );
        });
      });

      // Client A gửi HTTP request đặt lịch
      const postRes = await request(app.getHttpServer())
        .post('/schedules')
        .set('Authorization', `Bearer ${member1Token}`)
        .send({
          title: 'Họp Realtime Socket.IO Sprint X',
          resourceId: testResourceId,
          startTime,
          endTime,
        })
        .expect(201);

      const createdBody =
        postRes.body as ApiSuccessResponse<{ id: number }>;
      createdScheduleId = createdBody.data.id;

      // Client B nhận sự kiện scheduleCreated
      const receivedData = await eventPromise;
      expect(receivedData.id).toBe(createdScheduleId);
      expect(receivedData.title).toBe(
        'Họp Realtime Socket.IO Sprint X',
      );
      expect(receivedData.resourceId).toBe(testResourceId);
    });

    it('Client A cancels schedule -> Client B receives "scheduleCancelled" event in real-time', async () => {
      // Đăng ký listener trên Client B để hứng sự kiện hủy lịch
      const cancelPromise = new Promise<{ id: number }>(
        (resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(
              new Error(
                'Timeout: Client B không nhận được sự kiện scheduleCancelled!',
              ),
            );
          }, 3000);

          clientB.once('scheduleCancelled', (payload) => {
            clearTimeout(timeout);
            resolve(payload as { id: number });
          });
        },
      );

      // Client A gửi HTTP DELETE hủy lịch
      await request(app.getHttpServer())
        .delete(`/schedules/${createdScheduleId}`)
        .set('Authorization', `Bearer ${member1Token}`)
        .expect(200);

      // Client B nhận sự kiện scheduleCancelled
      const cancelledData = await cancelPromise;
      expect(cancelledData.id).toBe(createdScheduleId);
    });
  });
});
