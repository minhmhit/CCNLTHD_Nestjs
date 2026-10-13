import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';
import { createKeyv } from '@keyv/redis';
import { Resource } from './entities/resource.entity';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Resource]),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>(
          'REDIS_HOST',
          'localhost',
        );
        const port = configService.get<number>(
          'REDIS_PORT',
          6379,
        );
        return {
          stores: [createKeyv(`redis://${host}:${port}`)],
          ttl: 60 * 1000,
        };
      },
    }),
  ],
  controllers: [ResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService, TypeOrmModule],
})
export class ResourcesModule {}
