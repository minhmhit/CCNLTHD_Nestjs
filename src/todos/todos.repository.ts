import * as fs from 'fs';
import * as path from 'path';
import { Todo } from 'src/todos/entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoStatus } from './enums/todo-status.enum';
import { TodoPriority } from './enums/todo-priority.enum';
import { Injectable } from '@nestjs/common';

const TODOS_FILE = path.join(__dirname, 'todos.json');

@Injectable()
export class TodosRepository {
  private readFromFile(): Todo[] {
    const data = fs.readFileSync(TODOS_FILE, 'utf-8');
    return JSON.parse(data) as Todo[];
  }

  private writeToFile(todos: Todo[]): void {
    fs.writeFileSync(TODOS_FILE, JSON.stringify(todos, null, 2), 'utf-8');
  }

  private getNextId(todos: Todo[]): number {
    if (todos.length === 0) {
      return 1;
    }
    return todos[todos.length - 1].id + 1;
  }

  findAll(): Todo[] {
    return this.readFromFile();
  }

  findById(id: number) {
    const todos = this.readFromFile();
    return todos.find((todo) => todo.id === id);
  }

  findByTitle(title: string) {
    const todos = this.readFromFile();
    return todos.find((todo) => todo.title === title);
  }

  create(createTodoDto: CreateTodoDto): Todo {
    const todos = this.readFromFile();
    const newTodo: Todo = {
      id: this.getNextId(todos),
      title: createTodoDto.title,
      description: createTodoDto.description ?? '',
      status: createTodoDto.status ?? TodoStatus.OPEN,
      priority: createTodoDto.priority ?? TodoPriority.MEDIUM,
      categoryId: createTodoDto.categoryId,
      userId: createTodoDto.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    todos.push(newTodo);
    this.writeToFile(todos);
    return newTodo;
  }

  update(id: number, updateTodoDto: UpdateTodoDto) {
    const todos = this.readFromFile();
    const index = todos.findIndex((todo) => todo.id === id);
    if (index === -1) {
      return undefined;
    }
    todos[index] = {
      ...todos[index],
      ...updateTodoDto,
      updatedAt: new Date(),
    };
    this.writeToFile(todos);
    return todos[index];
  }

  delete(id: number): boolean {
    const todos = this.readFromFile();
    const index = todos.findIndex((todo) => todo.id === id);
    if (index === -1) {
      return false;
    }
    todos.splice(index, 1);
    this.writeToFile(todos);
    return true;
  }
}
