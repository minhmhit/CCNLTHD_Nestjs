import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import {
  ApiAuthTagDoc,
  ApiLoginDoc,
  ApiLogoutDoc,
  ApiProfileDoc,
  ApiRefreshDoc,
  ApiRegisterDoc,
} from 'src/swagger/docs/auth.doc';

@ApiAuthTagDoc()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiRegisterDoc()
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiLoginDoc()
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiRefreshDoc()
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(
      refreshTokenDto.refreshToken,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiLogoutDoc()
  async logout(@CurrentUser('id') userId: number) {
    return this.authService.logout(userId);
  }

  @Get('profile')
  @ApiProfileDoc()
  getProfile(@CurrentUser() user: Record<string, unknown>) {
    return user;
  }
}
