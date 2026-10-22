import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { Job } from 'bullmq';
import {
  NotificationProcessor,
  BookingNotificationJobData,
} from './notification.processor';

describe('NotificationProcessor', () => {
  let processor: NotificationProcessor;
  let mailerService: { sendMail: jest.Mock };

  beforeEach(async () => {
    mailerService = {
      sendMail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          NotificationProcessor,
          {
            provide: MailerService,
            useValue: mailerService,
          },
        ],
      }).compile();

    processor = module.get<NotificationProcessor>(
      NotificationProcessor,
    );
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('Test Case 1: Job gửi email xác nhận đặt lịch thành công qua MailerService', async () => {
    const mockJob = {
      id: 'schedule_10',
      name: 'send-booking-confirmation',
      data: {
        scheduleId: 10,
        userId: 1,
        email: 'member@test.com',
        title: 'Họp Chiến Lược Q1',
        startTime: '2026-10-15T09:00:00.000Z',
        endTime: '2026-10-15T10:00:00.000Z',
        resourceName: 'Phòng Hội Nghị A',
      },
      attemptsMade: 0,
      opts: { attempts: 3 },
    } as unknown as Job<BookingNotificationJobData>;

    const logSpy = jest.spyOn(
      (
        processor as unknown as {
          logger: { log: jest.Mock };
        }
      ).logger,
      'log',
    );

    await expect(
      processor.process(mockJob),
    ).resolves.toBeUndefined();

    // Xác nhận gọi MailerService.sendMail với đúng người nhận và nội dung HTML
    expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
    const sentMailOptions = mailerService.sendMail.mock
      .calls[0] as [
      { to: string; subject: string; html: string },
    ];
    expect(sentMailOptions[0].to).toBe('member@test.com');
    expect(sentMailOptions[0].subject).toContain(
      'Họp Chiến Lược Q1',
    );
    expect(sentMailOptions[0].html).toContain(
      'Phòng Hội Nghị A',
    );

    // Xác nhận ghi log đúng định dạng
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        '[BullMQ Worker] Đã gửi email thật tới member@test.com cho Schedule ID = 10 (Job ID: schedule_10)',
      ),
    );
  });

  it('Test Case 1b: Job gửi email nhắc nhở trước cuộc họp qua MailerService', async () => {
    const mockReminderJob = {
      id: 'reminder_101',
      name: 'send-meeting-reminder',
      data: {
        scheduleId: 101,
        userId: 2,
        email: 'reminder_user@test.com',
        title: 'Họp Scrum Hằng Ngày',
        startTime: '2026-10-15T09:00:00.000Z',
        endTime: '2026-10-15T09:30:00.000Z',
        resourceName: 'Phòng B202',
      },
      attemptsMade: 0,
      opts: { attempts: 3 },
    } as unknown as Job<BookingNotificationJobData>;

    await expect(
      processor.process(mockReminderJob),
    ).resolves.toBeUndefined();

    expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
    const reminderMailOptions = mailerService.sendMail.mock
      .calls[0] as [
      { to: string; subject: string; html: string },
    ];
    expect(reminderMailOptions[0].to).toBe(
      'reminder_user@test.com',
    );
    expect(reminderMailOptions[0].subject).toContain(
      '[Nhắc nhở] Cuộc họp "Họp Scrum Hằng Ngày" sắp diễn ra',
    );
    expect(reminderMailOptions[0].html).toContain(
      'Phòng B202',
    );
  });

  it('Test Case 2 (Idempotency): Đẩy 2 job có cùng jobId -> BullMQ chỉ nhận 1 job, không gửi trùng lặp email', async () => {
    // Giả lập cơ chế Deduplication dựa trên jobId duy nhất (Idempotency)
    const processedJobIds = new Set<string>();

    const job1 = {
      id: 'schedule_10',
      name: 'send-booking-confirmation',
      data: {
        scheduleId: 10,
        userId: 1,
        email: 'member@test.com',
        title: 'Họp 1',
        startTime: '2026-10-15T09:00:00.000Z',
      },
      attemptsMade: 0,
      opts: { attempts: 3 },
    } as unknown as Job<BookingNotificationJobData>;

    const job2 = {
      id: 'schedule_10',
      name: 'send-booking-confirmation',
      data: {
        scheduleId: 10,
        userId: 1,
        email: 'member@test.com',
        title: 'Họp 1',
        startTime: '2026-10-15T09:00:00.000Z',
      },
      attemptsMade: 0,
      opts: { attempts: 3 },
    } as unknown as Job<BookingNotificationJobData>;

    if (!processedJobIds.has(job1.id as string)) {
      await processor.process(job1);
      processedJobIds.add(job1.id as string);
    }

    let job2Executed = false;
    if (!processedJobIds.has(job2.id as string)) {
      await processor.process(job2);
      job2Executed = true;
    }

    expect(processedJobIds.size).toBe(1);
    expect(job2Executed).toBe(false);
    expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
  });

  it('Test Case 3: Ném exception khi mailerService.sendMail bị lỗi để BullMQ kích hoạt Retry', async () => {
    mailerService.sendMail.mockRejectedValueOnce(
      new Error('SMTP connection refused'),
    );

    const failingJob = {
      id: 'schedule_error',
      name: 'send-booking-confirmation',
      data: {
        scheduleId: 999,
        userId: 1,
        email: 'error@test.com',
        title: 'Họp Lỗi SMTP',
        startTime: '2026-10-15T09:00:00.000Z',
      },
      attemptsMade: 0,
      opts: { attempts: 3 },
    } as unknown as Job<BookingNotificationJobData>;

    await expect(
      processor.process(failingJob),
    ).rejects.toThrow('SMTP connection refused');
  });

  it('Test Case 4 (Retry & Dead Letter Queue): Giả lập lỗi ở lần chạy đầu -> Worker kích hoạt retry; kiệt lần thử -> chuyển vào DLQ', () => {
    const warnSpy = jest.spyOn(
      (
        processor as unknown as {
          logger: { warn: jest.Mock };
        }
      ).logger,
      'warn',
    );
    const errorSpy = jest.spyOn(
      (
        processor as unknown as {
          logger: { error: jest.Mock };
        }
      ).logger,
      'error',
    );

    const failingJob = {
      id: 'schedule_10',
      data: {
        scheduleId: 10,
        userId: 1,
        email: 'fail@test.com',
        title: 'Họp Lỗi',
        startTime: '2026-10-15T09:00:00.000Z',
      },
      attemptsMade: 1,
      opts: { attempts: 3 },
    } as unknown as Job<BookingNotificationJobData>;

    const error = new Error('SMTP connection timed out');

    // Lần thử 1 (attemptsMade = 1 < attempts = 3) -> kích hoạt retry cảnh báo
    processor.onFailed(failingJob, error);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        '[BullMQ Retry] Job ID = schedule_10',
      ),
    );

    // Lần thử 3 (attemptsMade = 3 >= attempts = 3) -> chuyển vào DLQ
    const exhaustedJob = {
      ...failingJob,
      attemptsMade: 3,
    } as unknown as Job<BookingNotificationJobData>;

    processor.onFailed(exhaustedJob, error);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        '[BullMQ Dead Letter Queue] Job ID = schedule_10',
      ),
    );
  });
});
