import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private sanitizeUser(user: User): Omit<User, 'password'> {
    const userObj = { ...user };
    delete (userObj as Partial<User>).password;
    return userObj;
  }

  async register(
    registerDto: RegisterDto,
  ): Promise<Omit<User, 'password'>> {
    const existingUser =
      await this.usersService.findByEmail(
        registerDto.email,
      );
    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng!');
    }

    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      10,
    );
    const createdUser = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      fullName: registerDto.fullName,
    });

    return this.sanitizeUser(createdUser);
  }

  async login(loginDto: LoginDto): Promise<{
    accessToken: string;
    user: Omit<User, 'password'>;
  }> {
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

    const accessToken = await this.generateToken(user);

    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  generateToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.signAsync(payload);
  }
}
