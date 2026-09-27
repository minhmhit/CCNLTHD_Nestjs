import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TodosModule } from './todos/todos.module';

@Module({
  controllers: [AppController],
  providers: [],
  imports: [TodosModule],
})
export class AppModule {}