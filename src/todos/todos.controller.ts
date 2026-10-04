import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Patch,
  Delete,
  Query,
  HttpCode,
  ParseIntPipe,
  UseGuards,
  SerializeOptions,
} from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { QueryParamsDto } from './dto/query-params.dto';
import { TodosService } from './todos.service';
import { TodoOwnershipGuard } from './guards/todo-ownership.guard';
import { AuthGuard } from 'src/common/guards/auth.guard';
import {
  GROUP_USER_BASIC,
  GROUP_USER_DETAIL,
} from 'src/users/entities/user.entity';

@Controller('todos')
export class TodosController {
  constructor(private todosService: TodosService) {}

  @Get()
  @SerializeOptions({ groups: [GROUP_USER_BASIC] })
  findAll(@Query() queryParamsDto: QueryParamsDto) {
    return this.todosService.findAll(queryParamsDto);
  }
  @Get(':id')
  @SerializeOptions({ groups: [GROUP_USER_DETAIL] })
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
  @UseGuards(AuthGuard, TodoOwnershipGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.todosService.delete(id);
  }
}
