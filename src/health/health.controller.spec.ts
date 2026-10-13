import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import {
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: { check: jest.Mock };
  let dbIndicator: { pingCheck: jest.Mock };
  let memoryIndicator: {
    checkHeap: jest.Mock;
    checkRSS: jest.Mock;
  };
  let redisIndicator: { isHealthy: jest.Mock };

  beforeEach(async () => {
    healthCheckService = {
      check: jest
        .fn()
        .mockImplementation(
          async (
            indicators: Array<
              () => Promise<Record<string, unknown>>
            >,
          ) => {
            const results = await Promise.all(
              indicators.map((fn) => fn()),
            );
            const info: Record<string, unknown> = {};
            for (const res of results) {
              Object.assign(info, res);
            }
            return {
              status: 'ok',
              info,
              details: info,
            };
          },
        ),
    };

    dbIndicator = {
      pingCheck: jest
        .fn()
        .mockResolvedValue({ database: { status: 'up' } }),
    };

    memoryIndicator = {
      checkHeap: jest.fn().mockResolvedValue({
        memory_heap: { status: 'up' },
      }),
      checkRSS: jest.fn().mockResolvedValue({
        memory_rss: { status: 'up' },
      }),
    };

    redisIndicator = {
      isHealthy: jest
        .fn()
        .mockResolvedValue({ redis: { status: 'up' } }),
    };

    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [HealthController],
        providers: [
          {
            provide: HealthCheckService,
            useValue: healthCheckService,
          },
          {
            provide: TypeOrmHealthIndicator,
            useValue: dbIndicator,
          },
          {
            provide: MemoryHealthIndicator,
            useValue: memoryIndicator,
          },
          {
            provide: RedisHealthIndicator,
            useValue: redisIndicator,
          },
        ],
      }).compile();

    controller = module.get<HealthController>(
      HealthController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should perform health check on database, redis, memory heap, and rss', async () => {
    const result = await controller.check();

    expect(healthCheckService.check).toHaveBeenCalled();
    expect(dbIndicator.pingCheck).toHaveBeenCalledWith(
      'database',
    );
    expect(redisIndicator.isHealthy).toHaveBeenCalledWith(
      'redis',
    );
    expect(memoryIndicator.checkHeap).toHaveBeenCalledWith(
      'memory_heap',
      300 * 1024 * 1024,
    );
    expect(memoryIndicator.checkRSS).toHaveBeenCalledWith(
      'memory_rss',
      500 * 1024 * 1024,
    );

    expect(result.status).toBe('ok');
    expect(result.info).toEqual({
      database: { status: 'up' },
      redis: { status: 'up' },
      memory_heap: { status: 'up' },
      memory_rss: { status: 'up' },
    });
  });
});
