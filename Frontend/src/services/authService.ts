import { apiClient } from './apiClient';
import {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
  Campus,
  Department,
  UpdateUserPayload,
  NotificationPreference,
  UpdateNotificationPreferencePayload,
} from '../types/auth';
import { DEMO_USERS } from './demoFixtures';

export const authService = {
  async getCampuses(): Promise<Campus[]> {
    const res = await apiClient.get<Campus[] | { data: Campus[] }>('/campuses', { skipAuth: true });
    if (Array.isArray(res)) return res;
    if (Array.isArray((res as any)?.data)) return (res as any).data;
    return [];
  },
  async login(payload: LoginPayload): Promise<AuthResponse> {
    if (apiClient.isDemoMode()) {
      const email = payload.email.toLowerCase();
      let user = DEMO_USERS.student;
      if (email.includes('admin') || email.includes('security')) {
        user = DEMO_USERS.admin;
      } else if (email.includes('faculty') || email.includes('dr.') || email.includes('prof')) {
        user = DEMO_USERS.faculty;
      }
      return {
        accessToken: 'demo-jwt-token-12345',
        expiresIn: 900,
        user,
      };
    }

    const res = await apiClient.post<AuthResponse>('/auth/login', payload, { skipAuth: true });
    apiClient.setAccessToken(res.accessToken);
    return res;
  },

  async register(payload: RegisterPayload): Promise<User> {
    if (apiClient.isDemoMode()) {
      return {
        id: `user-${Date.now()}`,
        name: payload.name,
        email: payload.email,
        role: payload.role || DEMO_USERS.student.role,
        campusId: payload.campusId,
        departmentId: payload.departmentId,
        campus: DEMO_USERS.student.campus,
      };
    }
    return apiClient.post<User>('/auth/register', payload, { skipAuth: true });
  },

  async refresh(): Promise<AuthResponse> {
    if (apiClient.isDemoMode()) {
      return {
        accessToken: 'demo-jwt-refreshed-token',
        expiresIn: 900,
        user: DEMO_USERS.student,
      };
    }
    return apiClient.post<AuthResponse>('/auth/refresh', {}, { skipAuth: true });
  },

  async logout(): Promise<{ message?: string; success?: boolean }> {
    if (apiClient.isDemoMode()) {
      apiClient.setAccessToken(null);
      return { success: true };
    }
    try {
      const res = await apiClient.post<{ message?: string }>('/auth/logout');
      apiClient.setAccessToken(null);
      return res;
    } catch {
      apiClient.setAccessToken(null);
      return { success: true };
    }
  },

  async getProfile(): Promise<User> {
    if (apiClient.isDemoMode()) {
      return DEMO_USERS.student;
    }
    return apiClient.get<User>('/users/me');
  },

  async updateProfile(payload: UpdateUserPayload): Promise<User> {
    if (apiClient.isDemoMode()) {
      return { ...DEMO_USERS.student, ...payload };
    }
    return apiClient.patch<User>('/users/me', payload);
  },

  async getNotificationPreferences(): Promise<NotificationPreference> {
    if (apiClient.isDemoMode()) {
      return {
        userId: DEMO_USERS.student.id,
        emailEnabled: true,
        digestEnabled: false,
      };
    }
    return apiClient.get<NotificationPreference>('/users/me/notification-preferences');
  },

  async updateNotificationPreferences(
    payload: UpdateNotificationPreferencePayload,
  ): Promise<NotificationPreference> {
    if (apiClient.isDemoMode()) {
      return {
        userId: DEMO_USERS.student.id,
        emailEnabled: payload.emailEnabled ?? true,
        digestEnabled: payload.digestEnabled ?? false,
      };
    }
    return apiClient.patch<NotificationPreference>(
      '/users/me/notification-preferences',
      payload,
    );
  },
};
