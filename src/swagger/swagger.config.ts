import { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';
import {
  SWAGGER_CUSTOM_CSS,
  SWAGGER_CUSTOM_JS,
} from './swagger-theme';

export function setupSwagger(app: INestApplication): void {
  const swaggerDescription = `
| Mục | Chi tiết |
| :--- | :--- |
| **Đề tài** | Tìm hiểu và ứng dụng NestJS |
| **Học phần** | Các Công Nghệ Lập Trình Hiện Đại |
| **GVHD** | Phạm Thi Vương |
| **Nhóm** | 18 |
| **Thành viên** | 1. **Mai Hoàng Minh** *(Leader)*<br/>2. **Nguyễn Đức Minh**<br/>3. **Nguyễn Hoài Nam**<br/>4. **Nguyễn Ngọc Hải** |
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
    customCss: SWAGGER_CUSTOM_CSS,
    customJsStr: SWAGGER_CUSTOM_JS,
    customSiteTitle: 'Enterprise Scheduling API Portal',
  });
}
