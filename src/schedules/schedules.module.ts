import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from './entities/schedule.entity';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { ScheduleOwnershipGuard } from './guards/schedule-owner.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Schedule]),
    NotificationsModule,
  ],
  controllers: [SchedulesController],
  providers: [SchedulesService, ScheduleOwnershipGuard],
  exports: [
    SchedulesService,
    ScheduleOwnershipGuard,
    TypeOrmModule,
  ],
})
export class SchedulesModule {}
