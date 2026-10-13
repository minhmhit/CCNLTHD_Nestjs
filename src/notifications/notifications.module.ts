import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';
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
      }),
    }),
    BullModule.registerQueue({
      name: 'booking-notification',
    }),
  ],
  providers: [NotificationProcessor],
  exports: [BullModule],
})
export class NotificationsModule {}
