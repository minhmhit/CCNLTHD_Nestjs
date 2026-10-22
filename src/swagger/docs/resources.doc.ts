import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

export function ApiResourcesTagDoc() {
  return applyDecorators(ApiTags('Resources'));
}

export function ApiFindAllResourcesDoc() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        'Lấy danh sách phòng họp (Redis Cache-Aside HIT/MISS)',
      description:
        'Truy vấn danh mục tài nguyên phòng họp hỗ trợ phân trang và lọc theo sức chứa/tên. Áp dụng mô hình Cache-Aside Pattern qua Redis: Lần gọi đầu tiên (Cache MISS) truy vấn database và lưu cache với TTL; các lần gọi tiếp theo (Cache HIT) phản hồi tức thì từ Redis.',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      example: 1,
      description: 'Số trang (mặc định: 1)',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      example: 10,
      description:
        'Số lượng bản ghi mỗi trang (mặc định: 10)',
    }),
    ApiQuery({
      name: 'name',
      required: false,
      type: String,
      example: 'Hội Thảo',
      description: 'Tìm kiếm theo tên phòng họp',
    }),
    ApiQuery({
      name: 'minCapacity',
      required: false,
      type: Number,
      example: 5,
      description: 'Sức chứa tối thiểu',
    }),
    ApiQuery({
      name: 'maxCapacity',
      required: false,
      type: Number,
      example: 50,
      description: 'Sức chứa tối đa',
    }),
    ApiQuery({
      name: 'isActive',
      required: false,
      type: Boolean,
      example: true,
      description: 'Lọc theo trạng thái hoạt động',
    }),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách tài nguyên thành công.',
      schema: {
        example: {
          success: true,
          statusCode: 200,
          data: {
            items: [
              {
                id: 1,
                name: 'Phòng Hội Thảo A1',
                capacity: 20,
                isActive: true,
              },
            ],
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
          timestamp: '2026-10-22T08:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Chưa xác thực Bearer JWT token.',
    }),
  );
}

export function ApiFindOneResourceDoc() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Lấy chi tiết phòng họp theo ID',
      description:
        'Trả về thông tin chi tiết và sức chứa của một phòng họp cụ thể.',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID phòng họp',
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: 'Lấy thông tin tài nguyên thành công.',
      schema: {
        example: {
          success: true,
          statusCode: 200,
          data: {
            id: 1,
            name: 'Phòng Hội Thảo A1',
            capacity: 20,
            isActive: true,
          },
          timestamp: '2026-10-22T08:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Chưa xác thực Bearer token.',
    }),
    ApiResponse({
      status: 404,
      description:
        'Không tìm thấy tài nguyên với ID tương ứng.',
    }),
  );
}

export function ApiCreateResourceDoc() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        'Tạo mới phòng họp (Quyền ADMIN - Kích hoạt Cache Invalidation)',
      description:
        'Chỉ dành cho ADMIN. Tạo mới bản ghi tài nguyên phòng họp trong CSDL, đồng thời tự động xóa bỏ toàn bộ cache danh mục tài nguyên liên quan trong Redis theo Điều 9 để ngăn chặn Stale Cache.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['name', 'capacity'],
        properties: {
          name: {
            type: 'string',
            example: 'Phòng Hội Thảo A1',
            description:
              'Tên phòng họp hoặc tài nguyên (tối thiểu 3 ký tự)',
          },
          capacity: {
            type: 'number',
            example: 20,
            description:
              'Sức chứa tối đa (số người, tối thiểu 1)',
          },
          isActive: {
            type: 'boolean',
            example: true,
            description:
              'Trạng thái hoạt động của phòng họp',
            default: true,
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description:
        'Tạo tài nguyên thành công và đã purge cache cũ.',
      schema: {
        example: {
          success: true,
          statusCode: 201,
          data: {
            id: 2,
            name: 'Phòng Họp Ban Giám Đốc',
            capacity: 12,
            isActive: true,
          },
          timestamp: '2026-10-22T08:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Dữ liệu đầu vào không hợp lệ.',
    }),
    ApiResponse({
      status: 401,
      description: 'Chưa xác thực Bearer token.',
    }),
    ApiResponse({
      status: 403,
      description:
        'Từ chối truy cập (chỉ tài khoản ADMIN mới có quyền tạo).',
    }),
  );
}

export function ApiUpdateResourceDoc() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        'Cập nhật phòng họp (Quyền ADMIN - Kích hoạt Cache Invalidation)',
      description:
        'Chỉ dành cho ADMIN. Cập nhật thông tin phòng họp và tự động xóa cache liên quan trong Redis theo Điều 9 để đảm bảo dữ liệu mới nhất được phản ánh tức thì.',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID phòng họp cần cập nhật',
      example: 1,
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'Phòng Hội Thảo A1 VIP',
            description: 'Tên phòng họp mới',
          },
          capacity: {
            type: 'number',
            example: 25,
            description: 'Sức chứa mới',
          },
          isActive: {
            type: 'boolean',
            example: true,
            description: 'Trạng thái hoạt động mới',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description:
        'Cập nhật tài nguyên thành công và đã purge cache cũ.',
      schema: {
        example: {
          success: true,
          statusCode: 200,
          data: {
            id: 1,
            name: 'Phòng Hội Thảo A1 VIP',
            capacity: 25,
            isActive: true,
          },
          timestamp: '2026-10-22T08:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Chưa xác thực Bearer token.',
    }),
    ApiResponse({
      status: 403,
      description:
        'Từ chối truy cập do không có quyền ADMIN.',
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy phòng họp cần cập nhật.',
    }),
  );
}

export function ApiRemoveResourceDoc() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        'Xóa phòng họp (Quyền ADMIN - Kích hoạt Cache Invalidation)',
      description:
        'Chỉ dành cho ADMIN. Xóa phòng họp khỏi CSDL và lập tức xóa sạch cache liên quan trong Redis theo Điều 9.',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID phòng họp cần xóa',
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: 'Xóa tài nguyên thành công.',
      schema: {
        example: {
          success: true,
          statusCode: 200,
          data: {
            message: 'Xóa tài nguyên thành công!',
          },
          timestamp: '2026-10-22T08:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Chưa xác thực Bearer token.',
    }),
    ApiResponse({
      status: 403,
      description:
        'Từ chối truy cập do không có quyền ADMIN.',
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy tài nguyên cần xóa.',
    }),
  );
}
