import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateResourceDto {
  @IsString({ message: 'Tên tài nguyên phải là chuỗi' })
  @IsNotEmpty({
    message: 'Tên tài nguyên không được để trống',
  })
  @MinLength(3, {
    message: 'Tên tài nguyên phải có tối thiểu 3 ký tự',
  })
  name: string;

  @IsInt({ message: 'Sức chứa phải là số nguyên' })
  @Min(1, { message: 'Sức chứa tối thiểu là 1' })
  capacity: number;

  @IsOptional()
  @IsBoolean({
    message: 'Trạng thái hoạt động phải là kiểu boolean',
  })
  isActive?: boolean;
}
