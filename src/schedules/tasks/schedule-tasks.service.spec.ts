import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ScheduleTasksService } from './schedule-tasks.service';
import { Schedule } from '../entities/schedule.entity';
import { ScheduleStatus } from '../enums/schedule-status.enum';
import { getQueueToken } from '@nestjs/bullmq';

describe('ScheduleTasksService', () => {
  let service: ScheduleTasksService;
  let schedulesRepository: {
    createQueryBuilder: jest.Mock;
    save: jest.Mock;
  };
  let notificationQueue: {
    add: jest.Mock;
  };

  beforeEach(async () => {
    schedulesRepository = {
      createQueryBuilder: jest.fn(),
      save: jest.fn(),
    };

    notificationQueue = {
      add: jest
        .fn()
        .mockResolvedValue({ id: 'reminder_1' }),
    };

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          ScheduleTasksService,
          {
            provide: getRepositoryToken(Schedule),
            useValue: schedulesRepository,
          },
          {
            provide: getQueueToken('booking-notification'),
            useValue: notificationQueue,
          },
        ],
      }).compile();

    service = module.get<ScheduleTasksService>(
      ScheduleTasksService,
    );
  });

  describe('handleCronRemindersAndCleanup', () => {
    it('should scan upcoming confirmed schedules, push reminder jobs, and cancel expired pending schedules', async () => {
      const upcomingSchedule: Schedule = {
        id: 101,
        title: 'Họp Chiến Lược Tuần',
        userId: 2,
        resourceId: 1,
        startTime: new Date(Date.now() + 14.5 * 60 * 1000),
        endTime: new Date(Date.now() + 15.5 * 60 * 1000),
        status: ScheduleStatus.CONFIRMED,
        isReminderSent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Schedule;

      const expiredPendingSchedule: Schedule = {
        id: 102,
        title: 'Họp Treo Quá Hạn',
        userId: 3,
        resourceId: 1,
        startTime: new Date(Date.now() - 10 * 60 * 1000),
        endTime: new Date(Date.now() - 5 * 60 * 1000),
        status: ScheduleStatus.PENDING,
        isReminderSent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Schedule;

      // Mock createQueryBuilder cho 2 câu truy vấn tuần tự
      const upcomingQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([upcomingSchedule]),
      };

      const expiredQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([expiredPendingSchedule]),
      };

      let callCount = 0;
      schedulesRepository.createQueryBuilder.mockImplementation(
        () => {
          callCount++;
          if (callCount === 1) {
            return upcomingQb;
          }
          return expiredQb;
        },
      );

      schedulesRepository.save.mockImplementation(
        (entity: Schedule) => Promise.resolve(entity),
      );

      const result =
        await service.handleCronRemindersAndCleanup();

      expect(result.remindersSent).toBe(1);
      expect(result.expiredCancelled).toBe(1);

      // Xác nhận đẩy job nhắc nhở với đúng payload và idempotency key
      expect(notificationQueue.add).toHaveBeenCalledWith(
        'send-meeting-reminder',
        expect.objectContaining({
          scheduleId: 101,
          userId: 2,
          title: 'Họp Chiến Lược Tuần',
        }),
        expect.objectContaining({
          jobId: 'reminder_101',
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        }),
      );

      // Xác nhận cập nhật isReminderSent = true
      expect(upcomingSchedule.isReminderSent).toBe(true);
      expect(schedulesRepository.save).toHaveBeenCalledWith(
        upcomingSchedule,
      );

      // Xác nhận tự động chuyển status của lịch pending quá hạn sang CANCELLED
      expect(expiredPendingSchedule.status).toBe(
        ScheduleStatus.CANCELLED,
      );
      expect(schedulesRepository.save).toHaveBeenCalledWith(
        expiredPendingSchedule,
      );
    });

    it('should do nothing when there are no upcoming or expired schedules', async () => {
      const emptyQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      schedulesRepository.createQueryBuilder.mockReturnValue(
        emptyQb,
      );

      const result =
        await service.handleCronRemindersAndCleanup();

      expect(result.remindersSent).toBe(0);
      expect(result.expiredCancelled).toBe(0);
      expect(notificationQueue.add).not.toHaveBeenCalled();
      expect(
        schedulesRepository.save,
      ).not.toHaveBeenCalled();
    });
  });
});
