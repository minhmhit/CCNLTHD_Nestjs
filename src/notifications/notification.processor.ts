import {
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Job } from 'bullmq';

export interface BookingNotificationJobData {
  scheduleId: number;
  userId: number;
  email?: string;
  title: string;
  startTime: Date | string;
  endTime?: Date | string;
  resourceName?: string;
}

@Processor('booking-notification')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(
    NotificationProcessor.name,
  );

  constructor(
    private readonly mailerService: MailerService,
  ) {
    super();
  }

  async process(
    job: Job<BookingNotificationJobData>,
  ): Promise<void> {
    const {
      scheduleId,
      email,
      title,
      startTime,
      endTime,
      resourceName,
    } = job.data;

    const formattedStartTime =
      typeof startTime === 'string'
        ? startTime
        : new Date(startTime).toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
          });

    const formattedEndTime = endTime
      ? typeof endTime === 'string'
        ? endTime
        : new Date(endTime).toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
          })
      : 'Không xác định';

    const roomName = resourceName || 'Phòng họp tiêu chuẩn';
    const to = email || 'user@example.com';

    this.logger.log(
      `[BullMQ Worker] Bắt đầu xử lý Job ID = ${job.id ?? 'unknown'} (Attempt ${job.attemptsMade + 1}/${job.opts.attempts || 1}) - Schedule ID = ${scheduleId}`,
    );

    let subject = '';
    let html = '';

    if (job.name === 'send-meeting-reminder') {
      subject = `[Nhắc nhở] Cuộc họp "${title}" sắp diễn ra`;
      html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
          <h2 style="color: #1976d2; margin-top: 0;">Thông Báo Nhắc Nhở Lịch Họp</h2>
          <p>Xin chào,</p>
          <p>Cuộc họp của bạn chuẩn bị bắt đầu trong ít phút tới. Vui lòng kiểm tra chi tiết:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; width: 140px;">Tiêu đề:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${title}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Phòng họp:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${roomName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Thời gian bắt đầu:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formattedStartTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Thời gian kết thúc:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formattedEndTime}</td>
            </tr>
          </table>
          <p style="color: #666; font-size: 13px;">Vui lòng có mặt đúng giờ để cuộc họp diễn ra thuận lợi.</p>
        </div>
      `;
    } else {
      subject = `[Xác nhận] Đặt lịch phòng họp thành công: "${title}"`;
      html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
          <h2 style="color: #2e7d32; margin-top: 0;">Xác Nhận Đặt Lịch Phòng Họp</h2>
          <p>Xin chào,</p>
          <p>Lịch hẹn của bạn đã được hệ thống ghi nhận thành công. Dưới đây là thông tin chi tiết:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; width: 140px;">Mã lịch hẹn:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">#${scheduleId}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Tiêu đề:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${title}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Phòng họp:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${roomName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Thời gian bắt đầu:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formattedStartTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Thời gian kết thúc:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formattedEndTime}</td>
            </tr>
          </table>
          <p style="color: #666; font-size: 13px;">Cảm ơn bạn đã sử dụng hệ thống đặt lịch!</p>
        </div>
      `;
    }

    // Gửi email thật qua MailerService
    await this.mailerService.sendMail({
      to,
      subject,
      html,
    });

    this.logger.log(
      `[BullMQ Worker] Đã gửi email thật tới ${to} cho Schedule ID = ${scheduleId} (Job ID: ${job.id})`,
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
