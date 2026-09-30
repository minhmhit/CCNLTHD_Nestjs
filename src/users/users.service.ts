import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private users: User[] = [
    { id: 1, name: 'Alice', todos: [] },
    { id: 2, name: 'Bob', todos: [] },
  ];

  findById(id: number) {
    const user = this.users.find((user) => user.id === id);
    if (!user) {
      throw new NotFoundException(id);
    }
    return user;
  }
}
