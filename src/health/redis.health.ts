import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import * as net from 'net';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async isHealthy(
    key: string,
  ): Promise<HealthIndicatorResult> {
    const host = this.configService.get<string>(
      'REDIS_HOST',
      'localhost',
    );
    const port = this.configService.get<number>(
      'REDIS_PORT',
      6379,
    );

    return new Promise((resolve, reject) => {
      const socket = net.createConnection({
        host,
        port,
        timeout: 2000,
      });

      socket.on('connect', () => {
        socket.write('PING\r\n');
      });

      socket.on('data', (data) => {
        const response = data.toString();
        socket.end();
        if (response.includes('PONG')) {
          resolve(this.getStatus(key, true));
        } else {
          reject(
            new HealthCheckError(
              'Redis ping failed',
              this.getStatus(key, false, {
                message: response.trim(),
              }),
            ),
          );
        }
      });

      socket.on('error', (err) => {
        socket.destroy();
        reject(
          new HealthCheckError(
            'Redis connection failed',
            this.getStatus(key, false, {
              message: err.message,
            }),
          ),
        );
      });

      socket.on('timeout', () => {
        socket.destroy();
        reject(
          new HealthCheckError(
            'Redis connection timed out',
            this.getStatus(key, false, {
              message: 'Timeout',
            }),
          ),
        );
      });
    });
  }
}
