import { NotFoundException } from '@nestjs/common';

export class TodoNotFoundException extends NotFoundException {
  constructor(id: number) {
    super({
      message: `Todo with ID ${id} not found`,
      errorCode: 'TODO_NOT_FOUND',
      field: 'id',
    });
  }
}
