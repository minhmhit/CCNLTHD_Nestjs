import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

export function ApiAppTagDoc() {
  return applyDecorators(ApiTags('App'));
}

export function ApiAppGreetingDoc() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Kiểm tra trạng thái hệ thống API (Root Endpoint)',
      description:
        'Endpoint công khai trả về thông điệp chào mừng và xác nhận API đang vận hành ổn định.',
    }),
    ApiResponse({
      status: 200,
      description: 'API đang hoạt động bình thường.',
      schema: {
        example: {
          success: true,
          statusCode: 200,
          data: 'Scheduling API is running!',
          timestamp: '2026-10-22T08:00:00.000Z',
        },
      },
    }),
  );
}

export function ApiAppAdminOnlyDoc() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Endpoint thử nghiệm phân quyền Admin',
      description:
        'Yêu cầu Bearer JWT với vai trò ADMIN. Trả về thông điệp chào mừng Admin.',
    }),
    ApiResponse({
      status: 200,
      description: 'Truy cập thành công với quyền ADMIN.',
      schema: {
        example: {
          success: true,
          statusCode: 200,
          data: 'Xin chào Admin!',
          timestamp: '2026-10-22T08:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Chưa xác thực hoặc token không hợp lệ.',
    }),
    ApiResponse({
      status: 403,
      description:
        'Từ chối truy cập do không có vai trò ADMIN.',
    }),
  );
}
