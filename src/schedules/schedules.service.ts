import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { QueryScheduleDto } from './dto/query-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly schedulesRepository: Repository<Schedule>,
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
    userId: number,
  ): Promise<Schedule> {
    const schedule = this.schedulesRepository.create({
      ...createScheduleDto,
      startTime: new Date(createScheduleDto.startTime),
      endTime: new Date(createScheduleDto.endTime),
      userId,
    });

    return this.schedulesRepository.save(schedule);
  }

  async update(
    id: number,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<Schedule> {
    const schedule = await this.findById(id);

    if (updateScheduleDto.startTime) {
      schedule.startTime = new Date(
        updateScheduleDto.startTime,
      );
    }
    if (updateScheduleDto.endTime) {
      schedule.endTime = new Date(
        updateScheduleDto.endTime,
      );
    }
    if (updateScheduleDto.title) {
      schedule.title = updateScheduleDto.title;
    }
    if (updateScheduleDto.description !== undefined) {
      schedule.description = updateScheduleDto.description;
    }
    if (updateScheduleDto.resourceId) {
      schedule.resourceId = updateScheduleDto.resourceId;
    }

    return this.schedulesRepository.save(schedule);
  }

  async remove(id: number): Promise<{ message: string }> {
    const schedule = await this.findById(id);
    await this.schedulesRepository.remove(schedule);
    return {
      message: `Đã xóa lịch hẹn ID = ${id} thành công!`,
    };
  }
}
