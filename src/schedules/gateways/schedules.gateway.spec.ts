import { Test, TestingModule } from '@nestjs/testing';
import {
  JwtSocketPayload,
  SchedulesGateway,
} from './schedules.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';

describe('SchedulesGateway', () => {
  let gateway: SchedulesGateway;
  let jwtService: { verifyAsync: jest.Mock };
  let configService: { getOrThrow: jest.Mock };

  beforeEach(async () => {
    jwtService = {
      verifyAsync: jest.fn(),
    };

    configService = {
      getOrThrow: jest.fn().mockReturnValue('test-secret'),
    };

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          SchedulesGateway,
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

    gateway = module.get<SchedulesGateway>(
      SchedulesGateway,
    );
  });

  describe('handleConnection', () => {
    it('should authenticate client successfully with valid Bearer token', async () => {
      const mockPayload: JwtSocketPayload = {
        sub: 1,
        email: 'user@example.com',
        role: 'MEMBER',
      };
      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      const disconnectMock = jest.fn();
      const clientData: { user?: JwtSocketPayload } = {};
      const mockClient = {
        id: 'socket-1',
        handshake: {
          auth: { token: 'Bearer valid.jwt.token' },
          headers: {},
        },
        data: clientData,
        disconnect: disconnectMock,
      } as unknown as Socket;

      await gateway.handleConnection(mockClient);

      expect(configService.getOrThrow).toHaveBeenCalledWith(
        'JWT_SECRET',
      );
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        'valid.jwt.token',
        { secret: 'test-secret' },
      );
      expect(clientData.user).toEqual(mockPayload);
      expect(disconnectMock).not.toHaveBeenCalled();
    });

    it('should authenticate client successfully with token in handshake.headers', async () => {
      const mockPayload: JwtSocketPayload = {
        sub: 2,
        email: 'admin@example.com',
        role: 'ADMIN',
      };
      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      const disconnectMock = jest.fn();
      const clientData: { user?: JwtSocketPayload } = {};
      const mockClient = {
        id: 'socket-2',
        handshake: {
          auth: {},
          headers: { authorization: 'valid.token.raw' },
        },
        data: clientData,
        disconnect: disconnectMock,
      } as unknown as Socket;

      await gateway.handleConnection(mockClient);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        'valid.token.raw',
        { secret: 'test-secret' },
      );
      expect(clientData.user).toEqual(mockPayload);
      expect(disconnectMock).not.toHaveBeenCalled();
    });

    it('should disconnect client when auth token is missing', async () => {
      const disconnectMock = jest.fn();
      const mockClient = {
        id: 'socket-missing',
        handshake: {
          auth: {},
          headers: {},
        },
        data: {},
        disconnect: disconnectMock,
      } as unknown as Socket;

      await gateway.handleConnection(mockClient);

      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
      expect(disconnectMock).toHaveBeenCalled();
    });

    it('should disconnect client when JWT verification fails', async () => {
      jwtService.verifyAsync.mockRejectedValue(
        new Error('jwt expired'),
      );

      const disconnectMock = jest.fn();
      const mockClient = {
        id: 'socket-expired',
        handshake: {
          auth: { token: 'expired.token' },
          headers: {},
        },
        data: {},
        disconnect: disconnectMock,
      } as unknown as Socket;

      await gateway.handleConnection(mockClient);

      expect(disconnectMock).toHaveBeenCalled();
    });
  });

  describe('handleJoinRoom & handleLeaveRoom', () => {
    it('should join specified room with object data { resourceId }', () => {
      const joinMock = jest.fn();
      const mockClient = {
        id: 'socket-join-1',
        join: joinMock,
      } as unknown as Socket;

      const result = gateway.handleJoinRoom(mockClient, {
        resourceId: 5,
      });

      expect(joinMock).toHaveBeenCalledWith('resource_5');
      expect(result).toEqual({
        event: 'joinedRoom',
        room: 'resource_5',
      });
    });

    it('should join specified room with number data', () => {
      const joinMock = jest.fn();
      const mockClient = {
        id: 'socket-join-2',
        join: joinMock,
      } as unknown as Socket;

      const result = gateway.handleJoinRoom(mockClient, 10);

      expect(joinMock).toHaveBeenCalledWith('resource_10');
      expect(result).toEqual({
        event: 'joinedRoom',
        room: 'resource_10',
      });
    });

    it('should leave specified room', () => {
      const leaveMock = jest.fn();
      const mockClient = {
        id: 'socket-leave',
        leave: leaveMock,
      } as unknown as Socket;

      const result = gateway.handleLeaveRoom(mockClient, {
        resourceId: 5,
      });

      expect(leaveMock).toHaveBeenCalledWith('resource_5');
      expect(result).toEqual({
        event: 'leftRoom',
        room: 'resource_5',
      });
    });
  });
});
