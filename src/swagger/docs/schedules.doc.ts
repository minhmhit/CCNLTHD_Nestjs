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

export function ApiSchedulesTagDoc() {
  return applyDecorators(ApiTags('Schedules'));
}

export function ApiFindAllSchedulesDoc() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Lấy danh sách lịch họp',
      description:
        'Truy vấn danh sách lịch hẹn trong hệ thống hỗ trợ lọc theo khoảng thời gian (from, to), phòng họp (resourceId) và phân trang (page, limit).',
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
      name: 'from',
      required: false,
      type: String,
      example: '2026-11-01T00:00:00.000Z',
      description: 'Thời gian bắt đầu tìm kiếm (ISO8601)',
    }),
    ApiQuery({
      name: 'to',
      required: false,
      type: String,
      example: '2026-11-30T23:59:59.000Z',
      description: 'Thời gian kết thúc tìm kiếm (ISO8601)',
    }),
    ApiQuery({
      name: 'resourceId',
      required: false,
      type: Number,
      example: 1,
      description: 'Lọc lịch theo ID phòng họp',
    }),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách lịch họp thành công.',
      schema: {
        example: {
          success: true,
          statusCode: 200,
          data: {
            items: [
              {
                id: 1,
                title: 'Họp Chiến Lược Phát Triển Q4',
                description:
                  'Thảo luận kế hoạch mở rộng thị trường',
                startTime: '2026-11-01T09:00:00.000Z',
                endTime: '2026-11-01T10:30:00.000Z',
                status: 'CONFIRMED',
                userId: 1,
                resourceId: 1,
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
      description: 'Chưa xác thực Bearer token.',
    }),
  );
}

export function ApiFindOneScheduleDoc() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Lấy chi tiết lịch họp theo ID',
      description:
        'Truy vấn thông tin chi tiết một lịch họp kèm thông tin quan hệ user và resource.',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID lịch họp',
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: 'Lấy thông tin lịch họp thành công.',
      schema: {
        example: {
          success: true,
          statusCode: 200,
          data: {
            id: 1,
            title: 'Họp Chiến Lược Phát Triển Q4',
            startTime: '2026-11-01T09:00:00.000Z',
            endTime: '2026-11-01T10:30:00.000Z',
            status: 'CONFIRMED',
            userId: 1,
            resourceId: 1,
            user: { id: 1, email: 'member@test.com' },
            resource: { id: 1, name: 'Phòng Hội Thảo A1' },
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
        'Không tìm thấy lịch hẹn với ID tương ứng.',
    }),
  );
}

export function ApiCreateScheduleDoc() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        'Đặt lịch phòng họp mới (Pessimistic Lock, BullMQ & Realtime WebSocket)',
      description: `
Quy trình đặt lịch toàn diện tuân thủ các Golden Rules:
1. **Kiểm soát Tranh chấp (Điều 8):** Áp dụng Pessimistic Write Lock (\`pessimistic_write\`) trên bản ghi Resource bên trong Database Transaction để triệt tiêu Race Condition.
2. **Kiểm tra trùng lấn (Overlap Check):** Ngăn chặn xung đột khung giờ trên cùng phòng họp.
3. **Tác vụ nền bất đồng bộ (Điều 10):** Sau khi commit transaction, đẩy job vào BullMQ (\`booking-notification\`) với Idempotency Key (\`schedule_\${id}\`) và Exponential Backoff để gửi email thật qua MailerService. HTTP Response phản hồi client cực nhanh (< 20ms).
4. **Đồng bộ thời gian thực (Điều 11):** Phát sự kiện WebSocket \`scheduleCreated\` tới tất cả client đang join Room \`resource_\${resourceId}\`.
      `,
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: [
          'title',
          'resourceId',
          'startTime',
          'endTime',
        ],
        properties: {
          title: {
            type: 'string',
            example: 'Họp Chiến Lược Phát Triển Q4',
            description:
              'Tiêu đề cuộc họp (tối thiểu 3 ký tự)',
          },
          description: {
            type: 'string',
            example:
              'Thảo luận kế hoạch mở rộng thị trường và phân bổ nhân sự',
            description: 'Mô tả chi tiết nội dung cuộc họp',
          },
          resourceId: {
            type: 'number',
            example: 1,
            description:
              'ID phòng họp/tài nguyên cần đặt lịch',
          },
          startTime: {
            type: 'string',
            example: '2026-11-01T09:00:00.000Z',
            description:
              'Thời gian bắt đầu (chuẩn ISO8601, phải ở tương lai)',
          },
          endTime: {
            type: 'string',
            example: '2026-11-01T10:30:00.000Z',
            description:
              'Thời gian kết thúc (chuẩn ISO8601, phải sau startTime)',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description:
        'Đặt lịch phòng họp thành công. Job gửi email đã được đẩy vào hàng đợi nền và sự kiện WebSocket đã được phát.',
      schema: {
        example: {
          success: true,
          statusCode: 201,
          data: {
            id: 10,
            title: 'Họp Chiến Lược Phát Triển Q4',
            startTime: '2026-11-01T09:00:00.000Z',
            endTime: '2026-11-01T10:30:00.000Z',
            status: 'CONFIRMED',
            userId: 1,
            resourceId: 1,
            createdAt: '2026-10-22T08:00:00.000Z',
            updatedAt: '2026-10-22T08:00:00.000Z',
          },
          timestamp: '2026-10-22T08:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description:
        'Dữ liệu đầu vào không hợp lệ (lỗi class-validator hoặc thời gian không hợp lệ).',
    }),
    ApiResponse({
      status: 401,
      description: 'Chưa xác thực Bearer token.',
    }),
    ApiResponse({
      status: 404,
      description:
        'Tài nguyên phòng họp không tồn tại hoặc đang tạm ngưng hoạt động.',
    }),
    ApiResponse({
      status: 409,
      description:
        'Phòng họp đã được đặt trong khung giờ này. Vui lòng chọn thời gian khác!',
      schema: {
        example: {
          success: false,
          statusCode: 409,
          errorCode: 'CONFLICT',
          message:
            'Phòng họp đã được đặt trong khung giờ này. Vui lòng chọn thời gian khác!',
          requestId: 'e15b3df1-b956-42d4-9d1a-56360c2830f1',
          timestamp: '2026-10-22T08:00:00.000Z',
          path: '/schedules',
        },
      },
    }),
  );
}

export function ApiTestRollbackScheduleDoc() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        'Endpoint kiểm thử Transaction Rollback khi phát sinh lỗi hệ thống',
      description:
        'Mô phỏng tình huống phát sinh lỗi sau khi đã lưu lịch hẹn. Đảm bảo Database Transaction tự động Rollback sạch sẽ 100%, không để lại dữ liệu rác trong CSDL theo Điều 4.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: [
          'title',
          'resourceId',
          'startTime',
          'endTime',
        ],
        properties: {
          title: {
            type: 'string',
            example: 'Họp Test Rollback',
            description: 'Tiêu đề cuộc họp',
          },
          resourceId: {
            type: 'number',
            example: 1,
            description: 'ID phòng họp',
          },
          startTime: {
            type: 'string',
            example: '2026-11-01T09:00:00.000Z',
            description: 'Thời gian bắt đầu',
          },
          endTime: {
            type: 'string',
            example: '2026-11-01T10:00:00.000Z',
            description: 'Thời gian kết thúc',
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description:
        'Mô phỏng lỗi hệ thống thành công - Transaction đã tự động rollback.',
      schema: {
        example: {
          success: false,
          statusCode: 500,
          errorCode: 'INTERNAL_SERVER_ERROR',
          message:
            'Mô phỏng lỗi hệ thống sau khi lưu lịch hẹn (Ghi Audit Log thất bại) - Transaction tự động Rollback!',
          requestId: 'e15b3df1-b956-42d4-9d1a-56360c2830f1',
          timestamp: '2026-10-22T08:00:00.000Z',
          path: '/schedules/test-rollback',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Chưa xác thực Bearer token.',
    }),
  );
}

export function ApiUpdateScheduleDoc() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        'Cập nhật thông tin lịch họp (Quyền sở hữu ScheduleOwnershipGuard)',
      description:
        'Cập nhật tiêu đề, mô tả hoặc thời gian lịch họp. Bắt buộc người thực hiện phải là chính chủ đặt lịch hoặc ADMIN.',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID lịch họp cần cập nhật',
      example: 1,
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            example:
              'Họp Chiến Lược Phát Triển Q4 (Đã đổi giờ)',
            description: 'Tiêu đề mới',
          },
          description: {
            type: 'string',
            example: 'Thảo luận bổ sung KPI',
            description: 'Mô tả mới',
          },
          startTime: {
            type: 'string',
            example: '2026-11-01T14:00:00.000Z',
            description: 'Thời gian bắt đầu mới',
          },
          endTime: {
            type: 'string',
            example: '2026-11-01T15:30:00.000Z',
            description: 'Thời gian kết thúc mới',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Cập nhật lịch họp thành công.',
    }),
    ApiResponse({
      status: 401,
      description: 'Chưa xác thực Bearer token.',
    }),
    ApiResponse({
      status: 403,
      description:
        'Từ chối truy cập (Bạn không có quyền sửa lịch của người khác).',
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy lịch họp.',
    }),
  );
}

export function ApiUpdateScheduleStatusDoc() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        'Cập nhật trạng thái lịch họp (PENDING, CONFIRMED, CANCELLED)',
      description:
        'Thay đổi trạng thái của lịch họp. Yêu cầu quyền sở hữu hoặc ADMIN.',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID lịch họp',
      example: 1,
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
            example: 'CONFIRMED',
            description: 'Trạng thái mới của lịch họp',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Cập nhật trạng thái thành công.',
    }),
    ApiResponse({
      status: 401,
      description: 'Chưa xác thực Bearer token.',
    }),
    ApiResponse({
      status: 403,
      description:
        'Từ chối truy cập do không phải chủ sở hữu.',
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy lịch họp.',
    }),
  );
}

export function ApiRemoveScheduleDoc() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        'Hủy lịch phòng họp (Soft Cancel & Phát sự kiện WebSocket scheduleCancelled)',
      description:
        'Hủy lịch họp (chuyển trạng thái sang CANCELLED). Kiểm tra quyền sở hữu qua ScheduleOwnershipGuard và phát sự kiện realtime `scheduleCancelled` tới Room `resource_{resourceId}` qua WebSocket Gateway.',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID lịch họp cần hủy',
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description:
        'Hủy lịch họp thành công và đã phát sự kiện realtime.',
      schema: {
        example: {
          success: true,
          statusCode: 200,
          data: {
            id: 1,
            title: 'Họp Chiến Lược Phát Triển Q4',
            status: 'CANCELLED',
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
        'Từ chối truy cập do không phải chủ sở hữu lịch họp.',
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy lịch họp cần hủy.',
    }),
  );
}
