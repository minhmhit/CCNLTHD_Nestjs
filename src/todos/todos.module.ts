import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';

@Module({
  controllers: [TodosController],
})
export class TodosModule {}
