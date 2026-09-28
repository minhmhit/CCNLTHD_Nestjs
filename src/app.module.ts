import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TodosModule } from './todos/todos.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';

@Module({
  controllers: [AppController],
  providers: [],
  imports: [TodosModule, UsersModule, CategoriesModule],
})
export class AppModule {}