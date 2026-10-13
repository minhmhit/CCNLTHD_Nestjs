import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from './entities/schedule.entity';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { ScheduleOwnershipGuard } from './guards/schedule-owner.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { SchedulesGateway } from './gateways/schedules.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Schedule]),
    NotificationsModule,
    AuthModule,
  ],
  controllers: [SchedulesController],
  providers: [
    SchedulesService,
    ScheduleOwnershipGuard,
    SchedulesGateway,
  ],
  exports: [
    SchedulesService,
    ScheduleOwnershipGuard,
    SchedulesGateway,
    TypeOrmModule,
  ],
})
export class SchedulesModule {}
