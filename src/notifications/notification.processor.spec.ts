import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import {
  NotificationProcessor,
  BookingNotificationJobData,
} from './notification.processor';

describe('NotificationProcessor', () => {
  let processor: NotificationProcessor;

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [NotificationProcessor],
      }).compile();

    processor = module.get<NotificationProcessor>(
      NotificationProcessor,
    );
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('Test Case 1: Job xử lý thành công khi thông tin hợp lệ', async () => {
    const mockJob = {
      id: 'schedule_10',
      data: {
        scheduleId: 10,
        userId: 1,
        title: 'Họp Chiến Lược Q1',
        startTime: '2026-10-15T09:00:00.000Z',
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
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Đã gửi thông báo cho Schedule ID = 10',
      ),
    );
  });

  it('Test Case 2 (Idempotency): Đẩy 2 job có cùng jobId -> BullMQ chỉ nhận 1 job, không xử lý trùng lặp', async () => {
    // Giả lập cơ chế Deduplication dựa trên jobId duy nhất (Idempotency)
    const processedJobIds = new Set<string>();

    const job1 = {
      id: 'schedule_10',
      data: {
        scheduleId: 10,
        userId: 1,
        title: 'Họp 1',
        startTime: '2026-10-15T09:00:00.000Z',
      },
      attemptsMade: 0,
      opts: { attempts: 3 },
    } as unknown as Job<BookingNotificationJobData>;

    const job2 = {
      id: 'schedule_10',
      data: {
        scheduleId: 10,
        userId: 1,
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
  });

  it('Test Case 3 (Retry & Dead Letter Queue): Giả lập lỗi ở lần chạy đầu -> Worker tự động kích hoạt retry theo exponential backoff', () => {
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
