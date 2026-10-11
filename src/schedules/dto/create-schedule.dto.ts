import {
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { IsAfter } from '../validators/is-after.validator';
import { IsNotPastDate } from '../validators/is-not-past-date.validator';

export class CreateScheduleDto {
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @MinLength(3, { message: 'Tiêu đề tối thiểu 3 ký tự' })
  title: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;

  @IsInt({ message: 'resourceId phải là số nguyên' })
  resourceId: number;

  @IsISO8601(
    {},
    { message: 'startTime phải theo chuẩn ISO8601' },
  )
  @IsNotPastDate({
    message:
      'startTime phải lớn hơn hoặc bằng thời điểm hiện tại',
  })
  startTime: string;

  @IsISO8601(
    {},
    { message: 'endTime phải theo chuẩn ISO8601' },
  )
  @IsAfter('startTime', {
    message: 'endTime phải sau startTime',
  })
  endTime: string;
}
