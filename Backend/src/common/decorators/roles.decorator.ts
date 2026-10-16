import { SetMetadata } from '@nestjs/common';
import { Role } from '../../domain/enums';

export const ROLES_KEY = 'roles';
export type AllowedRole = Role | 'AUTHENTICATED';

export const Roles = (...roles: AllowedRole[]) => SetMetadata(ROLES_KEY, roles);
