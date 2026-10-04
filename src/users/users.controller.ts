import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  SerializeOptions,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { GROUP_USER_DETAIL } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get(':id')
  @SerializeOptions({ groups: [GROUP_USER_DETAIL] })
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }
}
