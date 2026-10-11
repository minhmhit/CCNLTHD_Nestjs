import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ScheduleOwnershipGuard } from './schedule-owner.guard';
import { SchedulesService } from '../schedules.service';
import { Role } from 'src/users/enums/role.enum';
import { Schedule } from '../entities/schedule.entity';

describe('ScheduleOwnershipGuard', () => {
  let guard: ScheduleOwnershipGuard;
  let mockSchedulesService: Partial<
    Record<keyof SchedulesService, jest.Mock>
  >;

  const createMockContext = (
    params: Record<string, string>,
    user?: Record<string, unknown>,
  ): ExecutionContext => {
    const mockRequest = {
      params,
      user,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    mockSchedulesService = {
      findById: jest.fn(),
    };
    guard = new ScheduleOwnershipGuard(
      mockSchedulesService as unknown as SchedulesService,
    );
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw BadRequestException if id is invalid or not a positive number', async () => {
    const context = createMockContext({ id: 'invalid_id' });
    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw ForbiddenException if currentUser is missing', async () => {
    const context = createMockContext({ id: '10' });
    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException if schedule does not exist', async () => {
    mockSchedulesService.findById?.mockResolvedValue(null);
    const context = createMockContext(
      { id: '10' },
      { id: 1, role: Role.MEMBER },
    );

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(NotFoundException);
  });

  it('should allow access if currentUser is ADMIN even if not the owner', async () => {
    const mockSchedule = {
      id: 10,
      userId: 99,
    } as Schedule;
    mockSchedulesService.findById?.mockResolvedValue(
      mockSchedule,
    );

    const context = createMockContext(
      { id: '10' },
      { id: 1, role: Role.ADMIN },
    );
    const canActivate = await guard.canActivate(context);

    expect(canActivate).toBe(true);
  });

  it('should allow access if currentUser is the owner of the schedule', async () => {
    const mockSchedule = {
      id: 10,
      userId: 5,
    } as Schedule;
    mockSchedulesService.findById?.mockResolvedValue(
      mockSchedule,
    );

    const context = createMockContext(
      { id: '10' },
      { id: 5, role: Role.MEMBER },
    );
    const canActivate = await guard.canActivate(context);

    expect(canActivate).toBe(true);
  });

  it('should throw ForbiddenException if user is neither admin nor the owner', async () => {
    const mockSchedule = {
      id: 10,
      userId: 5,
    } as Schedule;
    mockSchedulesService.findById?.mockResolvedValue(
      mockSchedule,
    );

    const context = createMockContext(
      { id: '10' },
      { id: 9, role: Role.MEMBER },
    );

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(ForbiddenException);
  });
});
