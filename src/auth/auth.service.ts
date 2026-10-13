import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: Omit<User, 'password' | 'refreshToken'>;
}

export interface RegisterResponse {
  user: User;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private sanitizeUser(
    user: User,
  ): Omit<User, 'password' | 'refreshToken'> {
    const userObj = { ...user };
    delete (userObj as Partial<User>).password;
    delete (userObj as Partial<User>).refreshToken;
    return userObj;
  }

  private async updateUserRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(
      refreshToken,
      10,
    );
    await this.usersService.updateRefreshToken(
      userId,
      hashedRefreshToken,
    );
  }

  async register(
    registerDto: RegisterDto,
  ): Promise<RegisterResponse> {
    const existingUser =
      await this.usersService.findByEmail(
        registerDto.email,
      );
    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng!');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      saltRounds,
    );
    const createdUser = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      fullName: registerDto.fullName,
    });

    const tokens = await this.generateTokens(createdUser);
    await this.updateUserRefreshToken(
      createdUser.id,
      tokens.refreshToken,
    );

    return { user: createdUser };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(
      loginDto.email,
    );
    if (!user) {
      throw new UnauthorizedException(
        'Email hoặc mật khẩu không chính xác!',
      );
    }

    const isMatch = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isMatch) {
      throw new UnauthorizedException(
        'Email hoặc mật khẩu không chính xác!',
      );
    }

    const tokens = await this.generateTokens(user);
    await this.updateUserRefreshToken(
      user.id,
      tokens.refreshToken,
    );

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async generateTokens(user: User): Promise<AuthTokens> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const jwtSecret =
      this.configService.getOrThrow<string>('JWT_SECRET');
    const jwtExpiresIn = this.configService.get<string>(
      'JWT_EXPIRES_IN',
    );
    const refreshSecret =
      this.configService.getOrThrow<string>(
        'JWT_REFRESH_SECRET',
      );
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: jwtExpiresIn as unknown as number,
      }),
      this.jwtService.signAsync(
        { sub: user.id },
        {
          secret: refreshSecret,
          expiresIn: refreshExpiresIn as unknown as number,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<AuthTokens> {
    const refreshSecret =
      this.configService.getOrThrow<string>(
        'JWT_REFRESH_SECRET',
      );

    let payload: { sub: number };
    try {
      payload = await this.jwtService.verifyAsync<{
        sub: number;
      }>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn!',
      );
    }

    const user = await this.usersService.findById(
      payload.sub,
    );
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException(
        'Refresh token đã bị thu hồi hoặc không hợp lệ!',
      );
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ!',
      );
    }

    const tokens = await this.generateTokens(user);
    await this.updateUserRefreshToken(
      user.id,
      tokens.refreshToken,
    );

    return {
      ...tokens,
    };
  }

  async logout(
    userId: number,
  ): Promise<{ message: string }> {
    await this.usersService.updateRefreshToken(
      userId,
      null,
    );
    return {
      message: 'Đăng xuất thành công!',
    };
  }
}
