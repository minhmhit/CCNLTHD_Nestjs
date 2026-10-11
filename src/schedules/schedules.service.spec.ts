import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  Repository,
} from 'typeorm';
import { SchedulesService } from './schedules.service';
import { Schedule } from './entities/schedule.entity';
import { ScheduleStatus } from './enums/schedule-status.enum';

describe('SchedulesService', () => {
  let service: SchedulesService;
  let schedulesRepository: Partial<
    Record<keyof Repository<Schedule>, jest.Mock>
  >;
  let dataSource: Partial<
    Record<keyof DataSource, jest.Mock>
  >;

  beforeEach(async () => {
    schedulesRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    dataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          SchedulesService,
          {
            provide: getRepositoryToken(Schedule),
            useValue: schedulesRepository,
          },
          {
            provide: DataSource,
            useValue: dataSource,
          },
        ],
      }).compile();

    service = module.get<SchedulesService>(
      SchedulesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should throw NotFoundException if schedule does not exist', async () => {
      schedulesRepository.findOne?.mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return schedule if found', async () => {
      const mockSchedule = {
        id: 1,
        title: 'Họp Team',
      } as Schedule;
      schedulesRepository.findOne?.mockResolvedValue(
        mockSchedule,
      );

      const result = await service.findById(1);
      expect(result).toBe(mockSchedule);
    });
  });

  describe('create (Transaction & Overlap Check)', () => {
    it('should throw NotFoundException if resource is not found or inactive', async () => {
      dataSource.transaction?.mockImplementation(
        async (
          cb: (manager: EntityManager) => Promise<unknown>,
        ) => {
          const mockManager = {
            findOne: jest.fn().mockResolvedValue(null),
          } as unknown as EntityManager;
          const result = await cb(mockManager);
          return result;
        },
      );

      await expect(
        service.create(
          {
            title: 'Họp',
            resourceId: 1,
            startTime: '2026-10-15T09:00:00.000Z',
            endTime: '2026-10-15T10:00:00.000Z',
          },
          1,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if overlapping schedule is found', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          id: 99,
          title: 'Trùng giờ',
        }),
      };

      dataSource.transaction?.mockImplementation(
        async (
          cb: (manager: EntityManager) => Promise<unknown>,
        ) => {
          const mockManager = {
            findOne: jest
              .fn()
              .mockResolvedValue({ id: 1, isActive: true }),
            getRepository: jest.fn().mockReturnValue({
              createQueryBuilder: () => mockQueryBuilder,
            }),
          } as unknown as EntityManager;
          const result = await cb(mockManager);
          return result;
        },
      );

      await expect(
        service.create(
          {
            title: 'Họp',
            resourceId: 1,
            startTime: '2026-10-15T09:00:00.000Z',
            endTime: '2026-10-15T10:00:00.000Z',
          },
          1,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should save and return new schedule when no overlap occurs', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      const createdSchedule = {
        id: 10,
        title: 'Họp',
        status: ScheduleStatus.CONFIRMED,
      };

      dataSource.transaction?.mockImplementation(
        async (
          cb: (manager: EntityManager) => Promise<unknown>,
        ) => {
          const mockManager = {
            findOne: jest
              .fn()
              .mockResolvedValue({ id: 1, isActive: true }),
            getRepository: jest.fn().mockReturnValue({
              createQueryBuilder: () => mockQueryBuilder,
            }),
            create: jest
              .fn()
              .mockReturnValue(createdSchedule),
            save: jest
              .fn()
              .mockResolvedValue(createdSchedule),
          } as unknown as EntityManager;
          const result = await cb(mockManager);
          return result;
        },
      );

      const result = await service.create(
        {
          title: 'Họp',
          resourceId: 1,
          startTime: '2026-10-15T09:00:00.000Z',
          endTime: '2026-10-15T10:00:00.000Z',
        },
        1,
      );

      expect(result).toBe(createdSchedule);
    });
  });

  describe('createWithSimulatedRollback', () => {
    it('should throw InternalServerErrorException to simulate rollback', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      dataSource.transaction?.mockImplementation(
        async (
          cb: (manager: EntityManager) => Promise<unknown>,
        ) => {
          const mockManager = {
            findOne: jest
              .fn()
              .mockResolvedValue({ id: 1, isActive: true }),
            getRepository: jest.fn().mockReturnValue({
              createQueryBuilder: () => mockQueryBuilder,
            }),
            create: jest.fn().mockReturnValue({}),
            save: jest.fn().mockResolvedValue({}),
          } as unknown as EntityManager;
          const result = await cb(mockManager);
          return result;
        },
      );

      await expect(
        service.createWithSimulatedRollback(
          {
            title: 'Lịch Rollback',
            resourceId: 1,
            startTime: '2026-10-15T09:00:00.000Z',
            endTime: '2026-10-15T10:00:00.000Z',
          },
          1,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('remove (Soft Cancel)', () => {
    it('should update status to CANCELLED and save', async () => {
      const mockSchedule = {
        id: 5,
        status: ScheduleStatus.CONFIRMED,
      } as Schedule;
      schedulesRepository.findOne?.mockResolvedValue(
        mockSchedule,
      );
      schedulesRepository.save?.mockImplementation(
        (entity: Schedule) => Promise.resolve(entity),
      );

      const result = await service.remove(5);
      expect(result.status).toBe(ScheduleStatus.CANCELLED);
      expect(schedulesRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ScheduleStatus.CANCELLED,
        }),
      );
    });
  });
});
