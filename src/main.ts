import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestIdMiddleware } from './common/middlewares/request-id.middleware';
import { AuthGuard } from './common/guards/auth.guard';
import { TimingInterceptor } from './common/interceptors/timing.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const requestIdMiddleware = new RequestIdMiddleware();
  app.use((req, res, next) =>
    requestIdMiddleware.use(req, res, next),
  );

  app.useGlobalGuards(new AuthGuard());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new TimingInterceptor());

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
