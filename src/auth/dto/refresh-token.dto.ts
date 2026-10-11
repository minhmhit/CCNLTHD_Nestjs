import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: 'Refresh token phải là chuỗi' })
  @IsNotEmpty({
    message: 'Refresh token không được để trống',
  })
  refreshToken: string;
}
