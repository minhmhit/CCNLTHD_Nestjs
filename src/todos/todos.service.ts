import { Todo } from 'src/todos/entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { QueryParamsDto } from './dto/query-params.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoriesService } from 'src/categories/categories.service';
import { UsersService } from 'src/users/users.service';
import { TodoNotFoundException } from './exceptions/todo-not-found.exception';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private readonly todosRepository: Repository<Todo>,
    private readonly categoriesService: CategoriesService,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(
    queryParamsDto: QueryParamsDto,
  ): Promise<Todo[]> {
    const page = queryParamsDto.page ?? 1;
    const limit = queryParamsDto.limit ?? 10;
    const start = (page - 1) * limit;

    const where = queryParamsDto.priority
      ? { priority: queryParamsDto.priority }
      : {};

    const todos = await this.todosRepository.find({
      where,
      take: limit,
      skip: start,
      relations: ['user', 'category'],
    });

    return todos;
  }

  async findById(id: number) {
    const todo = await this.todosRepository.findOne({
      where: { id },
      relations: ['user', 'category'],
    });
    if (!todo) {
      throw new TodoNotFoundException(id);
    }
    return todo;
  }

  async create(createTodoDto: CreateTodoDto) {
    const user = await this.usersService.findById(
      createTodoDto.userId,
    );
    if (!user) {
      throw new NotFoundException({
        message: `khong tim duoc user co ID ${createTodoDto.userId}`,
        errorCode: 'USER_NOT_FOUND',
        field: 'userId',
        statusCode: 404,
      });
    }
    if (createTodoDto.categoryId) {
      const category = await this.categoriesService.findOne(
        createTodoDto.categoryId,
      );
      if (!category) {
        throw new NotFoundException({
          message: `khong tim duoc category co ID ${createTodoDto.categoryId}`,
          errorCode: 'CATEGORY_NOT_FOUND',
          field: 'categoryId',
          statusCode: 404,
        });
      }
    }

    const existingTodo = await this.todosRepository.findOne(
      { where: { title: createTodoDto.title } },
    );
    if (existingTodo) {
      throw new BadRequestException({
        message: `Todo voi title ${createTodoDto.title} da ton tai`,
        errorCode: 'TODO_TITLE_DUPLICATE',
        field: 'title',
        statusCode: 400,
      });
    }
    return this.dataSource.transaction(async (manager) => {
      const savedTodo = await manager.save(
        Todo,
        createTodoDto,
      );
      await manager.update(
        User,
        { id: createTodoDto.userId },
        { lastActivityAt: new Date() },
      );

      return savedTodo;
    });
  }

  async update(id: number, updateTodoDto: UpdateTodoDto) {
    if (updateTodoDto.categoryId) {
      const category = await this.categoriesService.findOne(
        updateTodoDto.categoryId,
      );
      if (!category) {
        throw new NotFoundException(
          `Khong tim thay category voi id ${updateTodoDto.categoryId}`,
        );
      }
    }

    const todo = await this.todosRepository.findOne({
      where: { id },
    });
    if (!todo) {
      throw new TodoNotFoundException(id);
    }

    Object.assign(todo, updateTodoDto);

    return this.todosRepository.save(todo);
  }

  async delete(id: number) {
    const deleted = await this.todosRepository.delete(id);
    if (!deleted.affected) {
      throw new TodoNotFoundException(id);
    }
  }
}
