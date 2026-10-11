import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/users/enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (Role | string)[]) =>
  SetMetadata(ROLES_KEY, roles);
