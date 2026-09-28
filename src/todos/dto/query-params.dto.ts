import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { TodoPriority } from 'src/todos/enums/todo-priority.enum';

export class QueryParamsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  @IsOptional()
  @IsEnum(TodoPriority as object, {
    message: `priority phai la mot trong ${Object.values(TodoPriority as object).join(', ')}`,
  })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  priority?: TodoPriority = TodoPriority.MEDIUM;
}
