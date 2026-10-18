import { Role } from './enums';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  campusId: string;
  departmentId?: string | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  campus?: {
    id: string;
    name: string;
    code: string;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  campusId: string;
  departmentId?: string;
  role?: Role;
}

export interface UpdateUserPayload {
  name?: string;
  departmentId?: string;
}

export interface NotificationPreference {
  userId: string;
  emailEnabled: boolean;
  digestEnabled: boolean;
  updatedAt?: string;
}

export interface UpdateNotificationPreferencePayload {
  emailEnabled?: boolean;
  digestEnabled?: boolean;
}
