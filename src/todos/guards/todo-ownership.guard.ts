import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { TodosService } from '../todos.service';

@Injectable()
export class TodoOwnershipGuard implements CanActivate {
  constructor(private readonly todoService: TodosService) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request>();
    const todoId = Number(request.params.id);
    const userId = request.userId;

    const todo = await this.todoService.findById(todoId);

    if (todo.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    request.todo = todo;
    return true;
  }
}
