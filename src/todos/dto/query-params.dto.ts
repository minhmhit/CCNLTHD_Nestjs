import { TodoPriority } from 'src/todos/enums/todo-priority.enum';

export class QueryParamsDto {
  page?: number = 1;
  limit?: number = 10;
  priority?: TodoPriority = TodoPriority.MEDIUM;
}
