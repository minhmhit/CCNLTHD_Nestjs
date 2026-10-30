import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtSocketPayload {
  sub: number;
  email: string;
  role: string;
}

const getWsNamespace = (): string => {
  return (
    process.env.WS_NAMESPACE ||
    (process.env.NODE_ENV === 'test'
      ? '/test/schedules'
      : '/schedules')
  );
};

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: getWsNamespace(),
})
export class SchedulesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(
    SchedulesGateway.name,
  );

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const authHeader =
        (client.handshake.auth?.token as
          string | undefined) ||
        client.handshake.headers?.authorization;

      if (!authHeader) {
        this.logger.warn(
          `[WebSocket] Kết nối bị từ chối: Thiếu JWT Token (Socket ID: ${client.id})`,
        );
        client.disconnect();
        return;
      }

      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : authHeader.trim();

      const secret =
        this.configService.getOrThrow<string>('JWT_SECRET');
      const payload =
        await this.jwtService.verifyAsync<JwtSocketPayload>(
          token,
          {
            secret,
          },
        );

      (client.data as { user?: JwtSocketPayload }).user =
        payload;
      this.logger.log(
        `[WebSocket] Client kết nối thành công: Socket ID = ${client.id}, User ID = ${payload.sub} (${payload.email})`,
      );
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `[WebSocket] Kết nối bị từ chối: JWT không hợp lệ (${errorMessage}) - Socket ID: ${client.id}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(
      `[WebSocket] Client đã ngắt kết nối: Socket ID = ${client.id}`,
    );
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { resourceId: number } | number,
  ): { event: string; room: string } {
    const resourceId =
      typeof data === 'object' && data !== null
        ? data.resourceId
        : data;
    const roomName = `resource_${resourceId}`;
    void client.join(roomName);
    this.logger.log(
      `[WebSocket] Socket ${client.id} đã tham gia Room: ${roomName}`,
    );
    return { event: 'joinedRoom', room: roomName };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { resourceId: number } | number,
  ): { event: string; room: string } {
    const resourceId =
      typeof data === 'object' && data !== null
        ? data.resourceId
        : data;
    const roomName = `resource_${resourceId}`;
    void client.leave(roomName);
    this.logger.log(
      `[WebSocket] Socket ${client.id} đã rời khỏi Room: ${roomName}`,
    );
    return { event: 'leftRoom', room: roomName };
  }
}
