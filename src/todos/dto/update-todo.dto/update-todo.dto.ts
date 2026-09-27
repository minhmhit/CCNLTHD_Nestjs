import { TodoPriority } from 'src/todos/enums/todo-priority.enum';
import { TodoStatus } from 'src/todos/enums/todo-status.enum';

export class UpdateTodoDto {
  title?: string;
  description?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  categoryId?: number;
}
