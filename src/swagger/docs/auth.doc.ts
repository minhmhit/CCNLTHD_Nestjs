import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

export function ApiAuthTagDoc() {
  return applyDecorators(ApiTags('Auth'));
}

export function ApiRegisterDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Đăng ký tài khoản người dùng mới',
      description:
        'Tạo tài khoản MEMBER mới trong hệ thống. Mật khẩu được băm an toàn bằng bcrypt trước khi lưu trữ.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['email', 'password', 'fullName'],
        properties: {
          email: {
            type: 'string',
            example: 'member@test.com',
            description: 'Địa chỉ email người dùng',
          },
          password: {
            type: 'string',
            example: 'password123',
            description:
              'Mật khẩu tài khoản (tối thiểu 6 ký tự)',
          },
          fullName: {
            type: 'string',
            example: 'Nguyễn Văn A',
            description: 'Họ và tên người dùng',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Đăng ký tài khoản thành công.',
      schema: {
        example: {
          success: true,
          statusCode: 201,
          data: {
            user: {
              id: 2,
              email: 'member@test.com',
              fullName: 'Nguyễn Văn A',
              role: 'MEMBER',
              createdAt: '2026-10-22T08:00:00.000Z',
              updatedAt: '2026-10-22T08:00:00.000Z',
            },
          },
          timestamp: '2026-10-22T08:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Dữ liệu đầu vào không hợp lệ.',
      schema: {
        example: {
          success: false,
          statusCode: 400,
          errorCode: 'BAD_REQUEST',
          message: [
            'Email không đúng định dạng',
            'Mật khẩu phải có tối thiểu 6 ký tự',
          ],
          requestId: 'e15b3df1-b956-42d4-9d1a-56360c2830f1',
          timestamp: '2026-10-22T08:00:00.000Z',
          path: '/auth/register',
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Email đã được sử dụng trong hệ thống.',
      schema: {
        example: {
          success: false,
          statusCode: 409,
          errorCode: 'CONFLICT',
          message: 'Email đã được sử dụng!',
          requestId: 'e15b3df1-b956-42d4-9d1a-56360c2830f1',
          timestamp: '2026-10-22T08:00:00.000Z',
          path: '/auth/register',
        },
      },
    }),
  );
}

export function ApiLoginDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Đăng nhập vào hệ thống',
      description:
        'Xác thực email và mật khẩu, cấp cặp accessToken và refreshToken. Băm và lưu refreshToken vào DB theo Điều 3.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            example: 'member@test.com',
            description: 'Địa chỉ email đăng nhập',
          },
          password: {
            type: 'string',
            example: 'password123',
            description: 'Mật khẩu đăng nhập',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description:
        'Đăng nhập thành công, trả về cặp JWT tokens và thông tin tài khoản.',
      schema: {
        example: {
          success: true,
          statusCode: 200,
          data: {
            accessToken:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            user: {
              id: 1,
              email: 'admin@scheduling.com',
              fullName: 'System Administrator',
              role: 'ADMIN',
            },
          },
          timestamp: '2026-10-22T08:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description:
        'Dữ liệu yêu cầu đăng nhập không hợp lệ.',
    }),
    ApiResponse({
      status: 401,
      description: 'Email hoặc mật khẩu không chính xác.',
      schema: {
        example: {
          success: false,
          statusCode: 401,
          errorCode: 'UNAUTHORIZED',
          message: 'Email hoặc mật khẩu không chính xác!',
          requestId: 'e15b3df1-b956-42d4-9d1a-56360c2830f1',
          timestamp: '2026-10-22T08:00:00.000Z',
          path: '/auth/login',
        },
      },
    }),
  );
}

export function ApiRefreshDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cấp mới cặp Token (Token Rotation)',
      description:
        'Áp dụng cơ chế Token Rotation: Thu hồi refreshToken cũ, sinh mới cặp accessToken + refreshToken và cập nhật hash mới vào DB theo Điều 3.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
            example:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            description:
              'Refresh token để cấp mới cặp access/refresh token',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Làm mới token thành công.',
      schema: {
        example: {
          success: true,
          statusCode: 200,
          data: {
            accessToken:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          timestamp: '2026-10-22T08:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description:
        'RefreshToken không hợp lệ, đã hết hạn hoặc đã bị thu hồi trong DB.',
      schema: {
        example: {
          success: false,
          statusCode: 401,
          errorCode: 'UNAUTHORIZED',
          message:
            'Refresh token đã bị thu hồi hoặc không hợp lệ!',
          requestId: 'e15b3df1-b956-42d4-9d1a-56360c2830f1',
          timestamp: '2026-10-22T08:00:00.000Z',
          path: '/auth/refresh',
        },
      },
    }),
  );
}

export function ApiLogoutDoc() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Đăng xuất khỏi hệ thống',
      description:
        'Xóa sạch refreshToken đã băm trong database của người dùng để vô hiệu hóa phiên làm việc ngay lập tức theo Điều 3.',
    }),
    ApiResponse({
      status: 200,
      description: 'Đăng xuất thành công.',
      schema: {
        example: {
          success: true,
          statusCode: 200,
          data: {
            message: 'Đăng xuất thành công!',
          },
          timestamp: '2026-10-22T08:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description:
        'Chưa đăng nhập hoặc Bearer token không hợp lệ.',
    }),
  );
}

export function ApiProfileDoc() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Lấy thông tin tài khoản hiện tại',
      description:
        'Trích xuất thông tin người dùng từ Bearer JWT token đang đăng nhập.',
    }),
    ApiResponse({
      status: 200,
      description: 'Lấy thông tin tài khoản thành công.',
      schema: {
        example: {
          success: true,
          statusCode: 200,
          data: {
            id: 1,
            email: 'admin@scheduling.com',
            role: 'ADMIN',
          },
          timestamp: '2026-10-22T08:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Chưa đăng nhập.',
    }),
  );
}
