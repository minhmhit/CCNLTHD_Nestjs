import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { CategoriesModule } from 'src/categories/categories.module';
import { UsersModule } from 'src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Todo } from './entities/todo.entity';

@Module({
  controllers: [TodosController],
  providers: [TodosService],
  imports: [
    CategoriesModule,
    UsersModule,
    TypeOrmModule.forFeature([Todo]),
  ],
})
export class TodosModule {}
