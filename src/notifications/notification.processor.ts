import {
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

export interface BookingNotificationJobData {
  scheduleId: number;
  userId: number;
  title: string;
  startTime: Date | string;
}

@Processor('booking-notification')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(
    NotificationProcessor.name,
  );

  async process(
    job: Job<BookingNotificationJobData>,
  ): Promise<void> {
    const { scheduleId, userId, title, startTime } =
      job.data;
    const formattedStartTime =
      typeof startTime === 'string'
        ? startTime
        : new Date(startTime).toISOString();

    this.logger.log(
      `[BullMQ Worker] Bắt đầu xử lý Job ID = ${job.id ?? 'unknown'} (Attempt ${job.attemptsMade + 1}/${job.opts.attempts || 1}) - Schedule ID = ${scheduleId}`,
    );

    // Giả lập tác vụ I/O gửi email/thông báo xác nhận
    await new Promise((resolve) => setTimeout(resolve, 50));

    this.logger.log(
      `[BullMQ Worker] Đã gửi thông báo cho Schedule ID = ${scheduleId} (User ID: ${userId}, Tiêu đề: "${title}", Bắt đầu: ${formattedStartTime})`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(
    job: Job<BookingNotificationJobData>,
    error: Error,
  ): void {
    const isExhausted =
      job.attemptsMade >= (job.opts.attempts || 1);

    if (isExhausted) {
      this.logger.error(
        `[BullMQ Dead Letter Queue] Job ID = ${job.id} cho Schedule ID = ${job.data?.scheduleId} thất bại hoàn toàn sau ${job.attemptsMade} lần thử! Chuyển vào DLQ. Lỗi: ${error.message}`,
      );
    } else {
      this.logger.warn(
        `[BullMQ Retry] Job ID = ${job.id} cho Schedule ID = ${job.data?.scheduleId} thất bại ở lần thử ${job.attemptsMade}. Đang chờ retry theo exponential backoff... Lỗi: ${error.message}`,
      );
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(
      `[BullMQ Worker] Hoàn tất xử lý Job ID = ${job.id}`,
    );
  }
}
