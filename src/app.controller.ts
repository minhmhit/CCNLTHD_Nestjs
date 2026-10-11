import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';
import { Roles } from './common/decorators/roles.decorator';
import { Role } from './users/enums/role.enum';

@Controller()
export class AppController {
  @Public()
  @Get()
  greeting(): string {
    return 'Scheduling API is running!';
  }

  @Get('admin-only')
  @Roles(Role.ADMIN)
  adminOnly(): string {
    return 'Xin chào Admin!';
  }
}
