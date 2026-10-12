import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduleDto } from './create-schedule.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ScheduleStatus } from '../enums/schedule-status.enum';

export class UpdateScheduleDto extends PartialType(
  CreateScheduleDto,
) { }
