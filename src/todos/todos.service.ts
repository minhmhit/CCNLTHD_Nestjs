import { Todo } from 'src/todos/entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { QueryParamsDto } from './dto/query-params.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodosRepository } from './todos.repository';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
      throw new NotFoundException({
        message: `khong tim duoc todo co ID ${id}`,
        errorCode: 'TODO_NOT_FOUND',
        field: 'id',
        statusCode: 404,
      });
    }
    return todo;
  }

  create(createTodoDto: CreateTodoDto) {
    const user = this.usersService.findById(createTodoDto.userId);
    if (!user) {
      throw new NotFoundException({
        message: `khong tim duoc user co ID ${createTodoDto.userId}`,
        errorCode: 'USER_NOT_FOUND',
        field: 'userId',
        statusCode: 404,
      });
    }
    if (createTodoDto.categoryId) {
      const category = this.categoriesService.findOne(createTodoDto.categoryId);
      if (!category) {
        throw new NotFoundException({
          message: `khong tim duoc category co ID ${createTodoDto.categoryId}`,
          errorCode: 'CATEGORY_NOT_FOUND',
          field: 'categoryId',
          statusCode: 404,
        });
      }
    }

    const existingTodo = this.todosRepository.findByTitle(createTodoDto.title);
    if (existingTodo) {
      throw new BadRequestException({
        message: `Todo voi title ${createTodoDto.title} da ton tai`,
        errorCode: 'TODO_TITLE_DUPLICATE',
        field: 'title',
        statusCode: 400,
      });
    }
    return this.todosRepository.create(createTodoDto);
  }

  update(id: number, updateTodoDto: UpdateTodoDto) {
    const updateTodo = this.todosRepository.update(id, updateTodoDto);
    if (!updateTodo) {
      throw new NotFoundException({
        message: `khong tim duoc todo co ID ${id}`,
        errorCode: 'TODO_NOT_FOUND',
        field: 'id',
        statusCode: 404,
      });
    }
    return updateTodo;
  }

  delete(id: number) {
    const deleted = this.todosRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException({
        message: `khong tim duoc todo co ID ${id}`,
        errorCode: 'TODO_NOT_FOUND',
        field: 'id',
        statusCode: 404,
      });
    }
  }
}
