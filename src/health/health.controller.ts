import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../common/decorators/public.decorator';
import { RedisHealthIndicator } from './redis.health';
import {
  ApiHealthCheckDoc,
  ApiHealthTagDoc,
} from 'src/swagger/docs/health.doc';

@ApiHealthTagDoc()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly redisIndicator: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @Public()
  @ApiHealthCheckDoc()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redisIndicator.isHealthy('redis'),
      () =>
        this.memory.checkHeap(
          'memory_heap',
          300 * 1024 * 1024,
        ),
      () =>
        this.memory.checkRSS(
          'memory_rss',
          500 * 1024 * 1024,
        ),
    ]);
  }
}
