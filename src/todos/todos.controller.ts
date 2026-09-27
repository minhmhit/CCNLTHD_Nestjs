import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Patch,
  Delete,
  Headers,
} from '@nestjs/common';

@Controller('todos')
export class TodosController {
  @Get('about')
  findAll(): string {
    return 'get all todos';
  }
  @Get(':id')
  getTodoById(@Param() param: { id: string }) {
    return param.id;
  }

  @Post()
  create(@Body() body: any, @Headers('authorization') auth: string) {
    if (auth) {
      return 'da tao todo ' + body.title;
    }
    return 'ban chua dang nhap';
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return `Update todo with id ${id} and body ${body}`;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return `Remove todo with id ${id}`;
  }
}
