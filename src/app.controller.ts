import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';
import { Roles } from './common/decorators/roles.decorator';
import { Role } from './users/enums/role.enum';
import {
  ApiAppAdminOnlyDoc,
  ApiAppGreetingDoc,
  ApiAppTagDoc,
} from './swagger/docs/app.doc';

@ApiAppTagDoc()
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiAppGreetingDoc()
  greeting(): string {
    return 'Scheduling API is running!';
  }

  @Get('admin-only')
  @Roles(Role.ADMIN)
  @ApiAppAdminOnlyDoc()
  adminOnly(): string {
    return 'Xin chào Admin!';
  }
}
