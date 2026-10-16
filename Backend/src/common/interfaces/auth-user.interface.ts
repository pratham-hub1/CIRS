import { Role } from '../../domain/enums';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  campusId: string;
  departmentId?: string | null;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  campusId: string;
  departmentId?: string | null;
  jti?: string;
  iat?: number;
  exp?: number;
}
