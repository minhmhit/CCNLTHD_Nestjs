import { Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class QueryScheduleDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page phải là số nguyên' })
  @Min(1, { message: 'page tối thiểu là 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit phải là số nguyên' })
  @Min(1, { message: 'limit tối thiểu là 1' })
  @Max(100, { message: 'limit tối đa là 100' })
  limit?: number = 10;

  @IsOptional()
  @IsISO8601(
    {},
    { message: 'from phải theo chuẩn ISO8601' },
  )
  from?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'to phải theo chuẩn ISO8601' })
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'resourceId phải là số nguyên' })
  resourceId?: number;
}
