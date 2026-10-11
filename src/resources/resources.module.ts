import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resource } from './entities/resource.entity';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';

@Module({
  imports: [TypeOrmModule.forFeature([Resource])],
  controllers: [ResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService, TypeOrmModule],
})
export class ResourcesModule {}
