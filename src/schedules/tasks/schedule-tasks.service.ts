import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from '../entities/schedule.entity';
import { ScheduleStatus } from '../enums/schedule-status.enum';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ScheduleTasksService {
  private readonly logger = new Logger(
    ScheduleTasksService.name,
  );

  constructor(
    @InjectRepository(Schedule)
    private readonly schedulesRepository: Repository<Schedule>,
    @InjectQueue('booking-notification')
    private readonly notificationQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCronRemindersAndCleanup(): Promise<{
    remindersSent: number;
    expiredCancelled: number;
  }> {
    const now = new Date();
    const fromTime = new Date(
      now.getTime() + 14 * 60 * 1000,
    );
    const toTime = new Date(now.getTime() + 15 * 60 * 1000);

    this.logger.log(
      `[Cron Job] Bắt đầu quét lịch định kỳ: Quét nhắc nhở trong [${fromTime.toISOString()} - ${toTime.toISOString()}] và dọn dẹp lịch PENDING quá hạn...`,
    );

    // 1. Quét lịch CONFIRMED, chưa gửi nhắc nhở, startTime trong [T + 14m, T + 15m]
    const upcomingSchedules = await this.schedulesRepository
      .createQueryBuilder('schedule')
      .where('schedule.status = :status', {
        status: ScheduleStatus.CONFIRMED,
      })
      .andWhere(
        'schedule.isReminderSent = :isReminderSent',
        {
          isReminderSent: false,
        },
      )
      .andWhere('schedule.startTime >= :fromTime', {
        fromTime,
      })
      .andWhere('schedule.startTime <= :toTime', { toTime })
      .getMany();

    for (const schedule of upcomingSchedules) {
      await this.notificationQueue.add(
        'send-meeting-reminder',
        {
          scheduleId: schedule.id,
          userId: schedule.userId,
          title: schedule.title,
          startTime: schedule.startTime,
        },
        {
          jobId: `reminder_${schedule.id}`,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      );

      schedule.isReminderSent = true;
      await this.schedulesRepository.save(schedule);
      this.logger.log(
        `[Cron Job] Đã đẩy job nhắc nhở cho cuộc họp (Schedule ID = ${schedule.id}, Title: "${schedule.title}")`,
      );
    }

    // 2. Quét các lịch hẹn có startTime trong quá khứ mà status vẫn là PENDING -> tự động chuyển sang CANCELLED
    const expiredPendingSchedules =
      await this.schedulesRepository
        .createQueryBuilder('schedule')
        .where('schedule.status = :status', {
          status: ScheduleStatus.PENDING,
        })
        .andWhere('schedule.startTime < :now', { now })
        .getMany();

    for (const schedule of expiredPendingSchedules) {
      schedule.status = ScheduleStatus.CANCELLED;
      await this.schedulesRepository.save(schedule);
      this.logger.log(
        `[Cron Job] Tự động hủy lịch hẹn PENDING quá hạn (Schedule ID = ${schedule.id}, StartTime: ${schedule.startTime.toISOString()})`,
      );
    }

    this.logger.log(
      `[Cron Job] Hoàn tất quét định kỳ: Đã gửi nhắc nhở cho ${upcomingSchedules.length} cuộc họp, hủy ${expiredPendingSchedules.length} lịch PENDING quá hạn.`,
    );

    return {
      remindersSent: upcomingSchedules.length,
      expiredCancelled: expiredPendingSchedules.length,
    };
  }
}
