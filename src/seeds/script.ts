import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from 'src/app.module';
import { Category } from 'src/categories/entities/category.entity';
import { Todo } from 'src/todos/entities/todo.entity';
import { User } from 'src/users/entities/user.entity';
import { readFromFile } from 'src/utils/file';
import { Repository } from 'typeorm';

async function seed() {
  const app =
    await NestFactory.createApplicationContext(AppModule);
  const usersRepository = app.get<Repository<User>>(
    getRepositoryToken(User),
  );
  const categoriesRepository = app.get<
    Repository<Category>
  >(getRepositoryToken(Category));
  const todosRepository = app.get<Repository<Todo>>(
    getRepositoryToken(Todo),
  );

  const users = readFromFile<User[]>('users.json');
  const categories = readFromFile<Category[]>(
    'categories.json',
  );
  const todos = readFromFile<Todo[]>('todos.json');

  await usersRepository.save(users);
  await categoriesRepository.save(categories);
  await todosRepository.save(todos);

  await app.close();
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
