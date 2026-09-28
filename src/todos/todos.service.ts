import { Todo } from 'src/entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { QueryParamsDto } from './dto/query-params.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodosRepository } from './todos.repository';

export class TodosService {
  private todosRepository: TodosRepository;

  constructor() {
    this.todosRepository = new TodosRepository();
  }

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
