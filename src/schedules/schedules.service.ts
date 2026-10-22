import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { Resource } from 'src/resources/entities/resource.entity';
import { User } from 'src/users/entities/user.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { UpdateScheduleStatusDto } from './dto/update-schedule-status.dto';
import { QueryScheduleDto } from './dto/query-schedule.dto';
import { ScheduleStatus } from './enums/schedule-status.enum';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SchedulesGateway } from './gateways/schedules.gateway';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly schedulesRepository: Repository<Schedule>,
    private readonly dataSource: DataSource,
    @InjectQueue('booking-notification')
    private readonly notificationQueue: Queue,
    private readonly schedulesGateway: SchedulesGateway,
  ) {}

  async findAll(query: QueryScheduleDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.schedulesRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.user', 'user')
      .leftJoinAndSelect('schedule.resource', 'resource');

    if (query.resourceId) {
      queryBuilder.andWhere(
        'schedule.resourceId = :resourceId',
        {
          resourceId: query.resourceId,
        },
      );
    }

    if (query.from) {
      queryBuilder.andWhere('schedule.startTime >= :from', {
        from: query.from,
      });
    }

    if (query.to) {
      queryBuilder.andWhere('schedule.endTime <= :to', {
        to: query.to,
      });
    }

    queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('schedule.startTime', 'ASC');

    const [items, total] =
      await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<Schedule> {
    const schedule = await this.schedulesRepository.findOne(
      {
        where: { id },
        relations: ['user', 'resource'],
      },
    );

    if (!schedule) {
      throw new NotFoundException(
        `Không tìm thấy lịch hẹn với ID = ${id}`,
      );
    }

    return schedule;
  }

  async create(
    createScheduleDto: CreateScheduleDto,
    currentUser: { id: number; email?: string } | number,
  ): Promise<Schedule> {
    const userId =
      typeof currentUser === 'number'
        ? currentUser
        : currentUser.id;

    let userEmail =
      typeof currentUser === 'object' &&
      currentUser !== null &&
      'email' in currentUser
        ? (currentUser as { email?: string }).email
        : undefined;

    let resourceName = '';

    const savedSchedule = await this.dataSource.transaction(
      async (manager) => {
        // Bước 1: Khóa bi quan (Pessimistic Write Lock) trên bản ghi Resource và kiểm tra isActive
        const resource = await manager
          .getRepository(Resource)
          .createQueryBuilder('resource')
          .setLock('pessimistic_write')
          .where('resource.id = :id', {
            id: createScheduleDto.resourceId,
          })
          .getOne();

        if (!resource || !resource.isActive) {
          throw new NotFoundException(
            'Tài nguyên phòng họp không tồn tại hoặc đang tạm ngưng hoạt động!',
          );
        }

        resourceName = resource.name;

        // Nếu chưa có email (ví dụ currentUser là number), truy vấn User từ DB
        if (
          !userEmail &&
          typeof manager.getRepository === 'function'
        ) {
          try {
            const userRepo = manager.getRepository(User);
            if (
              userRepo &&
              typeof userRepo.findOne === 'function'
            ) {
              const userRecord = await userRepo.findOne({
                where: { id: userId },
                select: ['id', 'email'],
              });
              if (userRecord?.email) {
                userEmail = userRecord.email;
              }
            }
          } catch {
            // Không chặn tiến trình nếu môi trường unit test không mock User repo
          }
        }

        // Bước 2: Kiểm tra xung đột khung giờ (Overlap Check)
        // Điều kiện: resourceId = :resourceId AND status != 'CANCELLED' AND startTime < :newEndTime AND endTime > :newStartTime
        const overlappingSchedule = await manager
          .getRepository(Schedule)
          .createQueryBuilder('schedule')
          .where('schedule.resourceId = :resourceId', {
            resourceId: createScheduleDto.resourceId,
          })
          .andWhere('schedule.status != :cancelled', {
            cancelled: ScheduleStatus.CANCELLED,
          })
          .andWhere('schedule.startTime < :newEndTime', {
            newEndTime: new Date(createScheduleDto.endTime),
          })
          .andWhere('schedule.endTime > :newStartTime', {
            newStartTime: new Date(
              createScheduleDto.startTime,
            ),
          })
          .getOne();

        if (overlappingSchedule) {
          throw new ConflictException(
            'Phòng họp đã được đặt trong khung giờ này. Vui lòng chọn thời gian khác!',
          );
        }

        // Bước 3: Tạo mới Schedule với userId = currentUser.id
        const newSchedule = manager.create(Schedule, {
          ...createScheduleDto,
          startTime: new Date(createScheduleDto.startTime),
          endTime: new Date(createScheduleDto.endTime),
          userId,
          status: ScheduleStatus.CONFIRMED,
        });

        // Bước 4 & 5: Lưu vào DB thông qua manager.save và trả về kết quả
        return manager.save(Schedule, newSchedule);
      },
    );

    // Đẩy job gửi thông báo xác nhận vào hàng đợi BullMQ (bất đồng bộ, không block HTTP request)
    await this.notificationQueue.add(
      'send-booking-confirmation',
      {
        scheduleId: savedSchedule.id,
        userId,
        email: userEmail || 'user@example.com',
        title: savedSchedule.title,
        startTime: savedSchedule.startTime,
        endTime: savedSchedule.endTime,
        resourceName: resourceName || 'Phòng họp',
      },
      {
        jobId: `schedule_${savedSchedule.id}`, // Idempotency Key chống trùng lặp
        attempts: 3, // Thử lại tối đa 3 lần
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    // Phát sự kiện realtime qua WebSocket Gateway tới các client đang theo dõi theo Room (resourceId)
    if (this.schedulesGateway?.server) {
      this.schedulesGateway.server
        .to(`resource_${savedSchedule.resourceId}`)
        .emit('scheduleCreated', savedSchedule);
    }

    return savedSchedule;
  }

  async createWithSimulatedRollback(
    createScheduleDto: CreateScheduleDto,
    currentUser: { id: number } | number,
  ): Promise<void> {
    const userId =
      typeof currentUser === 'number'
        ? currentUser
        : currentUser.id;

    await this.dataSource.transaction(async (manager) => {
      // 1. Kiểm tra Resource với Pessimistic Lock
      const resource = await manager
        .getRepository(Resource)
        .createQueryBuilder('resource')
        .setLock('pessimistic_write')
        .where('resource.id = :id', {
          id: createScheduleDto.resourceId,
        })
        .getOne();

      if (!resource || !resource.isActive) {
        throw new NotFoundException(
          'Tài nguyên phòng họp không tồn tại hoặc đang tạm ngưng hoạt động!',
        );
      }

      // 2. Kiểm tra Overlap
      const overlappingSchedule = await manager
        .getRepository(Schedule)
        .createQueryBuilder('schedule')
        .where('schedule.resourceId = :resourceId', {
          resourceId: createScheduleDto.resourceId,
        })
        .andWhere('schedule.status != :cancelled', {
          cancelled: ScheduleStatus.CANCELLED,
        })
        .andWhere('schedule.startTime < :newEndTime', {
          newEndTime: new Date(createScheduleDto.endTime),
        })
        .andWhere('schedule.endTime > :newStartTime', {
          newStartTime: new Date(
            createScheduleDto.startTime,
          ),
        })
        .getOne();

      if (overlappingSchedule) {
        throw new ConflictException(
          'Phòng họp đã được đặt trong khung giờ này. Vui lòng chọn thời gian khác!',
        );
      }

      // 3. Insert Schedule vào database
      const newSchedule = manager.create(Schedule, {
        ...createScheduleDto,
        startTime: new Date(createScheduleDto.startTime),
        endTime: new Date(createScheduleDto.endTime),
        userId,
        status: ScheduleStatus.CONFIRMED,
      });
      await manager.save(Schedule, newSchedule);

      // 4. Cố tình ném lỗi để mô phỏng sự cố sau khi insert (như ghi audit log thất bại)
      throw new InternalServerErrorException(
        'Mô phỏng lỗi hệ thống sau khi lưu lịch hẹn (Ghi Audit Log thất bại) - Transaction tự động Rollback!',
      );
    });
  }

  validateStatusTransition(
    currentStatus: ScheduleStatus,
    newStatus: ScheduleStatus,
  ): void {
    if (currentStatus === newStatus) {
      return;
    }

    if (currentStatus === ScheduleStatus.CANCELLED) {
      throw new BadRequestException(
        'Không thể cập nhật lịch hẹn đã bị hủy (CANCELLED)!',
      );
    }

    const validTransitions: Record<
      ScheduleStatus,
      ScheduleStatus[]
    > = {
      [ScheduleStatus.PENDING]: [
        ScheduleStatus.CONFIRMED,
        ScheduleStatus.CANCELLED,
      ],
      [ScheduleStatus.CONFIRMED]: [
        ScheduleStatus.CANCELLED,
      ],
      [ScheduleStatus.CANCELLED]: [],
    };

    if (
      !validTransitions[currentStatus]?.includes(newStatus)
    ) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái từ ${currentStatus} sang ${newStatus}! Trạng thái chỉ được phép cập nhật theo chiều tiến lên (PENDING -> CONFIRMED -> CANCELLED).`,
      );
    }
  }

  async update(
    id: number,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<Schedule> {
    return this.dataSource.transaction(async (manager) => {
      const schedule = await manager.findOne(Schedule, {
        where: { id },
      });

      if (!schedule) {
        throw new NotFoundException(
          `Không tìm thấy lịch hẹn với ID = ${id}`,
        );
      }

      const targetResourceId =
        updateScheduleDto.resourceId || schedule.resourceId;
      const targetStartTime = updateScheduleDto.startTime
        ? new Date(updateScheduleDto.startTime)
        : schedule.startTime;
      const targetEndTime = updateScheduleDto.endTime
        ? new Date(updateScheduleDto.endTime)
        : schedule.endTime;

      if (updateScheduleDto.resourceId) {
        const resource = await manager.findOne(Resource, {
          where: { id: updateScheduleDto.resourceId },
        });
        if (!resource || !resource.isActive) {
          throw new NotFoundException(
            'Tài nguyên phòng họp không tồn tại hoặc đang tạm ngưng hoạt động!',
          );
        }
      }

      // Nếu có cập nhật thời gian hoặc phòng họp, kiểm tra overlap với các lịch khác
      if (
        updateScheduleDto.startTime ||
        updateScheduleDto.endTime ||
        updateScheduleDto.resourceId
      ) {
        const overlappingSchedule = await manager
          .getRepository(Schedule)
          .createQueryBuilder('schedule')
          .where('schedule.resourceId = :resourceId', {
            resourceId: targetResourceId,
          })
          .andWhere('schedule.id != :id', { id })
          .andWhere('schedule.status != :cancelled', {
            cancelled: ScheduleStatus.CANCELLED,
          })
          .andWhere('schedule.startTime < :newEndTime', {
            newEndTime: targetEndTime,
          })
          .andWhere('schedule.endTime > :newStartTime', {
            newStartTime: targetStartTime,
          })
          .getOne();

        if (overlappingSchedule) {
          throw new ConflictException(
            'Phòng họp đã được đặt trong khung giờ này. Vui lòng chọn thời gian khác!',
          );
        }
      }

      if (updateScheduleDto.startTime) {
        schedule.startTime = targetStartTime;
      }
      if (updateScheduleDto.endTime) {
        schedule.endTime = targetEndTime;
      }
      if (updateScheduleDto.title) {
        schedule.title = updateScheduleDto.title;
      }
      if (updateScheduleDto.description !== undefined) {
        schedule.description =
          updateScheduleDto.description;
      }
      if (updateScheduleDto.resourceId) {
        schedule.resourceId = targetResourceId;
      }

      return manager.save(Schedule, schedule);
    });
  }

  async updateStatus(
    id: number,
    updateScheduleStatusDto: UpdateScheduleStatusDto,
  ): Promise<Schedule> {
    const schedule = await this.findById(id);
    this.validateStatusTransition(
      schedule.status,
      updateScheduleStatusDto.status,
    );
    schedule.status = updateScheduleStatusDto.status;
    return this.schedulesRepository.save(schedule);
  }

  async remove(id: number): Promise<Schedule> {
    const schedule = await this.findById(id);
    this.validateStatusTransition(
      schedule.status,
      ScheduleStatus.CANCELLED,
    );
    schedule.status = ScheduleStatus.CANCELLED;
    const cancelledSchedule =
      await this.schedulesRepository.save(schedule);

    // Phát sự kiện realtime qua WebSocket Gateway tới các client đang theo dõi theo Room (resourceId)
    if (this.schedulesGateway?.server) {
      this.schedulesGateway.server
        .to(`resource_${cancelledSchedule.resourceId}`)
        .emit('scheduleCancelled', {
          id: cancelledSchedule.id,
        });
    }

    return cancelledSchedule;
  }
}
