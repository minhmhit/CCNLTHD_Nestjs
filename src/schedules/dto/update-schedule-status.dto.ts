import { IsEnum, IsNotEmpty } from 'class-validator';
import { ScheduleStatus } from '../enums/schedule-status.enum';

export class UpdateScheduleStatusDto {
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsEnum(ScheduleStatus, {
    message:
      'Trạng thái phải là PENDING, CONFIRMED hoặc CANCELLED',
  })
  status: ScheduleStatus;
}
