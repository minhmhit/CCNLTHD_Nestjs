import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/users/enums/role.enum';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findById: jest.Mock;
    findByEmail: jest.Mock;
    create: jest.Mock;
    updateRefreshToken: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
    verifyAsync: jest.Mock;
  };
  let configService: {
    getOrThrow: jest.Mock;
    get: jest.Mock;
  };

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    fullName: 'Test User',
    role: Role.MEMBER,
    refreshToken: 'hashed_db_refresh_token',
    createdAt: new Date(),
    updatedAt: new Date(),
    schedules: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    usersService = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      updateRefreshToken: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };
    configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test_jwt_secret';
        if (key === 'JWT_REFRESH_SECRET')
          return 'test_refresh_secret';
        return 'test_value';
      }),
      get: jest.fn(
        (_key: string, defaultVal: string) => defaultVal,
      ),
    };

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: UsersService,
            useValue: usersService,
          },
          {
            provide: JwtService,
            useValue: jwtService,
          },
          {
            provide: ConfigService,
            useValue: configService,
          },
        ],
      }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Test User',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash password, create user, generate both tokens and save hashed refreshToken', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock)
        .mockResolvedValueOnce('hashedpassword')
        .mockResolvedValueOnce('hashed_refresh_token');
      usersService.create.mockResolvedValue(mockUser);
      jwtService.signAsync
        .mockResolvedValueOnce('mock_access_token')
        .mockResolvedValueOnce('mock_refresh_token');

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(
        'password123',
        10,
      );
      expect(usersService.create).toHaveBeenCalled();
      expect(
        usersService.updateRefreshToken,
      ).toHaveBeenCalledWith(
        mockUser.id,
        'hashed_refresh_token',
      );
      expect(result).toHaveProperty(
        'accessToken',
        'mock_access_token',
      );
      expect(result).toHaveProperty(
        'refreshToken',
        'mock_refresh_token',
      );
      expect(result.user).toHaveProperty('id', 1);
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty(
        'refreshToken',
      );
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'notfound@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(
        false,
      );

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return accessToken, refreshToken and user, saving hashed refreshToken to DB', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue(
        'new_hashed_refresh',
      );
      jwtService.signAsync
        .mockResolvedValueOnce('mock_access_token')
        .mockResolvedValueOnce('mock_refresh_token');

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty(
        'accessToken',
        'mock_access_token',
      );
      expect(result).toHaveProperty(
        'refreshToken',
        'mock_refresh_token',
      );
      expect(
        usersService.updateRefreshToken,
      ).toHaveBeenCalledWith(
        mockUser.id,
        'new_hashed_refresh',
      );
      expect(result.user).toHaveProperty('id', 1);
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty(
        'refreshToken',
      );
    });
  });

  describe('refreshTokens', () => {
    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      jwtService.verifyAsync.mockRejectedValue(
        new Error('Invalid token'),
      );

      await expect(
        service.refreshTokens('invalid_token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user does not exist or has revoked refreshToken', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 1 });
      usersService.findById.mockResolvedValue({
        ...mockUser,
        refreshToken: null,
      });

      await expect(
        service.refreshTokens(
          'valid_jwt_but_revoked_in_db',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if refreshToken does not match DB hash', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 1 });
      usersService.findById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(
        false,
      );

      await expect(
        service.refreshTokens('tampered_refresh_token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should rotate tokens and update DB when refresh token is valid', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 1 });
      usersService.findById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue(
        'rotated_hashed_refresh',
      );
      jwtService.signAsync
        .mockResolvedValueOnce('new_access_token')
        .mockResolvedValueOnce('new_refresh_token');

      const result = await service.refreshTokens(
        'valid_refresh_token',
      );

      expect(result).toHaveProperty(
        'accessToken',
        'new_access_token',
      );
      expect(result).toHaveProperty(
        'refreshToken',
        'new_refresh_token',
      );
      expect(
        usersService.updateRefreshToken,
      ).toHaveBeenCalledWith(
        mockUser.id,
        'rotated_hashed_refresh',
      );
      expect(result.user).toHaveProperty('id', 1);
    });
  });

  describe('logout', () => {
    it('should remove refreshToken from database (revoke/blacklist token)', async () => {
      usersService.updateRefreshToken.mockResolvedValue(
        undefined,
      );

      const result = await service.logout(1);

      expect(
        usersService.updateRefreshToken,
      ).toHaveBeenCalledWith(1, null);
      expect(result).toHaveProperty(
        'message',
        'Đăng xuất thành công!',
      );
    });
  });
});
