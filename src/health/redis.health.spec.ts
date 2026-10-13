import { Test, TestingModule } from '@nestjs/testing';
import { RedisHealthIndicator } from './redis.health';
import { ConfigService } from '@nestjs/config';
import * as net from 'net';
import { EventEmitter } from 'events';

jest.mock('net');

describe('RedisHealthIndicator', () => {
  let indicator: RedisHealthIndicator;
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    configService = {
      get: jest.fn(
        (key: string, defaultValue?: unknown) => {
          if (key === 'REDIS_HOST') return 'localhost';
          if (key === 'REDIS_PORT') return 6379;
          return defaultValue;
        },
      ),
    };

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          RedisHealthIndicator,
          {
            provide: ConfigService,
            useValue: configService,
          },
        ],
      }).compile();

    indicator = module.get<RedisHealthIndicator>(
      RedisHealthIndicator,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return status up when Redis responds with PONG', async () => {
    const mockSocket = Object.assign(new EventEmitter(), {
      write: jest.fn(),
      end: jest.fn(),
      destroy: jest.fn(),
    });

    (net.createConnection as jest.Mock).mockImplementation(
      () => {
        setImmediate(() => {
          mockSocket.emit('connect');
          mockSocket.emit('data', Buffer.from('+PONG\r\n'));
        });
        return mockSocket;
      },
    );

    const result = await indicator.isHealthy('redis');

    expect(result).toEqual({
      redis: { status: 'up' },
    });
    expect(mockSocket.write).toHaveBeenCalledWith(
      'PING\r\n',
    );
    expect(mockSocket.end).toHaveBeenCalled();
  });

  it('should throw HealthCheckError when Redis connection fails with error', async () => {
    const mockSocket = Object.assign(new EventEmitter(), {
      write: jest.fn(),
      end: jest.fn(),
      destroy: jest.fn(),
    });

    (net.createConnection as jest.Mock).mockImplementation(
      () => {
        setImmediate(() => {
          mockSocket.emit(
            'error',
            new Error('ECONNREFUSED 127.0.0.1:6379'),
          );
        });
        return mockSocket;
      },
    );

    await expect(
      indicator.isHealthy('redis'),
    ).rejects.toThrow('Redis connection failed');
    expect(mockSocket.destroy).toHaveBeenCalled();
  });

  it('should throw HealthCheckError when Redis socket times out', async () => {
    const mockSocket = Object.assign(new EventEmitter(), {
      write: jest.fn(),
      end: jest.fn(),
      destroy: jest.fn(),
    });

    (net.createConnection as jest.Mock).mockImplementation(
      () => {
        setImmediate(() => {
          mockSocket.emit('timeout');
        });
        return mockSocket;
      },
    );

    await expect(
      indicator.isHealthy('redis'),
    ).rejects.toThrow('Redis connection timed out');
    expect(mockSocket.destroy).toHaveBeenCalled();
  });

  it('should throw HealthCheckError when Redis response is not PONG', async () => {
    const mockSocket = Object.assign(new EventEmitter(), {
      write: jest.fn(),
      end: jest.fn(),
      destroy: jest.fn(),
    });

    (net.createConnection as jest.Mock).mockImplementation(
      () => {
        setImmediate(() => {
          mockSocket.emit('connect');
          mockSocket.emit(
            'data',
            Buffer.from('-ERR unknown command\r\n'),
          );
        });
        return mockSocket;
      },
    );

    await expect(
      indicator.isHealthy('redis'),
    ).rejects.toThrow('Redis ping failed');
    expect(mockSocket.end).toHaveBeenCalled();
  });
});
