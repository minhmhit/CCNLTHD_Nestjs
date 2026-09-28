import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Patch,
  Delete,
  Headers,
  Query,
  HttpCode,
  ParseIntPipe,
} from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { QueryParamsDto } from './dto/query-params.dto';
import { TodosService } from './todos.service';

@Controller('todos')
export class TodosController {
  private todosService: TodosService;

  constructor() {
    this.todosService = new TodosService();
  }

  @Get()
  findAll(@Query() queryParamsDto: QueryParamsDto) {
    return this.todosService.findAll(queryParamsDto);
  }
  @Get(':id')
  getTodoById(@Param('id', ParseIntPipe) id: number) {
    return this.todosService.findById(id);
  }

  @Post()
  create(@Body() createTodoDto: CreateTodoDto) {
    return this.todosService.create(createTodoDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTodoDto: UpdateTodoDto,
  ) {
    return this.todosService.update(id, updateTodoDto);
  }

  @HttpCode(204)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.todosService.delete(id);
  }
}
