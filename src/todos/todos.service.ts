import { Todo } from 'src/todos/entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { QueryParamsDto } from './dto/query-params.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodosRepository } from './todos.repository';
import { Injectable } from '@nestjs/common';
import { CategoriesService } from 'src/categories/categories.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class TodosService {
  constructor(
    private todosRepository: TodosRepository,
    private readonly categoriesService: CategoriesService,
    private readonly usersService: UsersService,
  ) {}

  findAll(queryParamsDto: QueryParamsDto): Todo[] {
    let todos = this.todosRepository.findAll();
    if (queryParamsDto.priority) {
      todos = todos.filter((todo) => todo.priority === queryParamsDto.priority);
    }

    const page = queryParamsDto.page ?? 1;
    const limit = queryParamsDto.limit ?? 10;
    const start = (page - 1) * limit;
    return todos.slice(start, start + limit);
  }

  findById(id: number) {
    const todo = this.todosRepository.findById(id);
    if (!todo) {
      throw new Error(`khong tim duoc todo co ID ${id}`);
    }
    return todo;
  }

  create(createTodoDto: CreateTodoDto) {
    const user = this.usersService.findById(createTodoDto.userId);
    if (!user) {
      throw new Error(`khong tim duoc user co ID ${createTodoDto.userId}`);
    }
    if (createTodoDto.categoryId) {
      const category = this.categoriesService.findOne(createTodoDto.categoryId);
      if (!category) {
        throw new Error(
          `khong tim duoc category co ID ${createTodoDto.categoryId}`,
        );
      }
    }
    return this.todosRepository.create(createTodoDto);
  }

  update(id: number, updateTodoDto: UpdateTodoDto) {
    const updateTodo = this.todosRepository.update(id, updateTodoDto);
    if (!updateTodo) {
      throw new Error(`khong tim duoc todo co ID ${id}`);
    }
    return updateTodo;
  }

  delete(id: number) {
    const deleted = this.todosRepository.delete(id);
    if (!deleted) {
      throw new Error(`khong tim duoc todo co ID ${id}`);
    }
  }
}
