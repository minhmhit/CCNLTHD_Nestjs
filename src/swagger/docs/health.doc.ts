import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

export function ApiHealthTagDoc() {
  return applyDecorators(ApiTags('Health'));
}

export function ApiHealthCheckDoc() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Kiểm tra sức khỏe hệ thống (Terminus Health Check)',
      description:
        'Endpoint công khai kiểm tra tính sẵn sàng của PostgreSQL, Redis Cache & Queue, dung lượng bộ nhớ Memory Heap và Memory RSS.',
    }),
    ApiResponse({
      status: 200,
      description:
        'Hệ thống đang vận hành khỏe mạnh (status: ok).',
      schema: {
        example: {
          status: 'ok',
          info: {
            database: { status: 'up' },
            redis: { status: 'up' },
            memory_heap: { status: 'up' },
            memory_rss: { status: 'up' },
          },
          error: {},
          details: {
            database: { status: 'up' },
            redis: { status: 'up' },
            memory_heap: { status: 'up' },
            memory_rss: { status: 'up' },
          },
        },
      },
    }),
    ApiResponse({
      status: 503,
      description:
        'Một hoặc nhiều thành phần hệ thống gặp sự cố (status: error).',
    }),
  );
}
