import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { NotificationProcessor } from './notification.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>(
            'REDIS_HOST',
            'localhost',
          ),
          port: configService.get<number>(
            'REDIS_PORT',
            6379,
          ),
        },
        prefix: configService.get<string>(
          'BULL_PREFIX',
          configService.get<string>('NODE_ENV') === 'test'
            ? 'bull_test'
            : 'bull',
        ),
      }),
    }),
    BullModule.registerQueue({
      name: 'booking-notification',
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.getOrThrow<string>(
            'MAIL_HOST',
          ),
          port: Number(
            configService.getOrThrow<string>('MAIL_PORT'),
          ),
          secure: false,
          auth: {
            user: configService.getOrThrow<string>(
              'MAIL_USER',
            ),
            pass: configService.getOrThrow<string>(
              'MAIL_PASS',
            ),
          },
        },
        defaults: {
          from: configService.getOrThrow<string>(
            'MAIL_FROM',
          ),
        },
      }),
    }),
  ],
  providers: [NotificationProcessor],
  exports: [BullModule, MailerModule],
})
export class NotificationsModule {}
