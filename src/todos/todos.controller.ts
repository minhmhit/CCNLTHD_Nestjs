import { Controller, Get, Post } from '@nestjs/common';

@Controller('todos')
export class TodosController {
  @Get()
  findAll(): string {
    return 'get all todos';
  }

  @Post()
  create(): string {
    return 'create a todo';
  }
}
