import { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const swaggerDescription = `
Hệ thống API Quản lý & Đặt lịch phòng họp trực tuyến (Enterprise Scheduling Platform).

### 📡 Realtime WebSocket Specification (\`/schedules\` namespace)

| Thông số | Giá trị chi tiết |
| :--- | :--- |
| **Namespace URL** | \`ws://localhost:3000/schedules\` (hoặc \`http://localhost:3000/schedules\`) |
| **Giao thức** | Socket.IO (v4) / WebSocket Transports (\`websocket\`, \`polling\`) |
| **Xác thực (Auth)** | Truyền Bearer JWT Token qua \`auth.token: "<accessToken>"\` hoặc \`extraHeaders.authorization: "Bearer <accessToken>"\` |
| **Phân quyền** | Yêu cầu tài khoản hợp lệ (\`ADMIN\` hoặc \`MEMBER\`) |

#### 📥 Client to Server Events
| Event Name | Payload Format | Mô tả |
| :--- | :--- | :--- |
| \`joinRoom\` | \`{ "resourceId": 1 }\` (hoặc số/chuỗi \`1\`) | Client tham gia vào Room theo dõi phòng họp tương ứng (\`resource_1\`) |

#### 📤 Server to Client Broadcast Events
| Event Name | Room Mục Tiêu | Payload Format | Mô tả |
| :--- | :--- | :--- | :--- |
| \`scheduleCreated\` | \`resource_{resourceId}\` | \`Schedule\` Object | Phát tới tất cả client trong phòng khi có lịch đặt thành công mới |
| \`scheduleCancelled\` | \`resource_{resourceId}\` | \`{ scheduleId, resourceId, cancelledAt }\` | Phát tới tất cả client trong phòng khi lịch họp bị hủy |
`;

  const config = new DocumentBuilder()
    .setTitle('Scheduling Web App API')
    .setDescription(swaggerDescription)
    .setVersion('1.0')
    .addServer(
      'http://localhost:3000',
      'Local Instance 1 (Default - Port 3000)',
    )
    .addServer(
      'http://localhost:3001',
      'Local Instance 2 (Scale/Cluster Test - Port 3001)',
    )
    .addServer(
      'http://localhost:8080',
      'Docker / Load Balancer Gateway',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(
    app,
    config,
  );
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
