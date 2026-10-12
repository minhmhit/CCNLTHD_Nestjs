import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class QueryResourceDto {
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
  @IsString({ message: 'Tên tìm kiếm phải là chuỗi' })
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'minCapacity phải là số nguyên' })
  @Min(1, { message: 'minCapacity tối thiểu là 1' })
  minCapacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'maxCapacity phải là số nguyên' })
  @Min(1, { message: 'maxCapacity tối thiểu là 1' })
  maxCapacity?: number;

  @IsOptional()
  @Transform(
    ({
      value,
    }: {
      value: unknown;
    }): boolean | undefined => {
      if (value === 'true' || value === true) return true;
      if (value === 'false' || value === false)
        return false;
      return typeof value === 'boolean' ? value : undefined;
    },
  )
  @IsBoolean({
    message:
      'isActive phải là giá trị boolean (true/false)',
  })
  isActive?: boolean;
}
