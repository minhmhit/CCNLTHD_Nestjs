import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { TodoPriority } from 'src/todos/enums/todo-priority.enum';
import { TodoStatus } from 'src/todos/enums/todo-status.enum';

export class CreateTodoDto {
  @IsString()
  @MinLength(2, {
    message: 'title khong duoc de trong',
  })
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TodoStatus as object, {
    message: `status phai la 1 trong: ${Object.values(TodoStatus as object).join(',')}`,
  })
  status?: TodoStatus;
  @IsOptional()
  @IsEnum(TodoPriority as object, {
    message: `priority phai la 1 trong: ${Object.values(TodoPriority as object).join(',')}`,
  })
  priority?: TodoPriority;

  @IsOptional()
  @IsInt({
    message: 'categoryId phai la 1 so nguyen',
  })
  categoryId?: number;

  @IsInt({
    message: 'userId phai la 1 so nguyen',
  })
  userId!: number;
}
