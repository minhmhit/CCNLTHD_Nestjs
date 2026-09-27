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
} from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { QueryParamsDto } from './dto/query-params.dto';

@Controller('todos')
export class TodosController {
  @Get()
  findAll(@Query() queryParamsDto: QueryParamsDto) {
    return `lay todos voi priority ${queryParamsDto.priority} va limit ${queryParamsDto.limit} , ${queryParamsDto.page}`;
  }
  @Get(':id')
  getTodoById(@Param() param: { id: string }) {
    return param.id;
  }

  @Post()
  create(
    @Body() createTodoDto: CreateTodoDto,
    @Headers('authorization') auth: string,
  ) {
    if (auth) {
      return 'da tao todo: ' + JSON.stringify(createTodoDto);
    }
    return 'ban chua dang nhap';
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTodoDto: UpdateTodoDto) {
    return `update todo ${id} voi body ${JSON.stringify(updateTodoDto)}`;
  }

  @HttpCode(204)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return `Remove todo with id ${id}`;
  }
}
