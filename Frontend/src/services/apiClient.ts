import { ApiError, ApiErrorEnvelope } from '../types/api';

/**
 * Normalizes backend URL and origin from environment variables
 * Ensures /api/v1 is never duplicated and root endpoints (e.g. /health) target the origin.
 */
export function getApiConfig() {
  const raw = (import.meta.env.VITE_API_BASE_URL || '').trim();

  let backendOrigin = '';
  let apiBase = '/api/v1';

  if (raw) {
    try {
      const urlObj = new URL(raw, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');
      backendOrigin = urlObj.origin;

      const cleanPath = urlObj.pathname.replace(/\/+$/, '');
      if (cleanPath.endsWith('/api/v1')) {
        apiBase = `${backendOrigin}${cleanPath}`;
      } else if (cleanPath === '' || cleanPath === '/') {
        apiBase = `${backendOrigin}/api/v1`;
      } else {
        apiBase = `${backendOrigin}${cleanPath}/api/v1`;
      }
    } catch {
      apiBase = raw.replace(/\/+$/, '');
    }
  }

  return { backendOrigin, apiBase };
}

export interface RequestOptions extends RequestInit {
  idempotencyKey?: string;
  skipAuth?: boolean;
  params?: Record<string, string | number | boolean | undefined | null>;
}

class ApiClient {
  private accessToken: string | null = null;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];
  // Demo mode is strictly opt-in via VITE_DEMO_MODE=true, never automatic
  private demoMode: boolean = import.meta.env.VITE_DEMO_MODE === 'true';

  constructor() {
    // Retain opt-in only if explicitly set in environment
    this.demoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  }

  public setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public isDemoMode(): boolean {
    return this.demoMode;
  }

  public setDemoMode(enabled: boolean) {
    this.demoMode = enabled;
  }

  public getBackendOrigin(): string {
    return getApiConfig().backendOrigin;
  }

  public getApiBase(): string {
    return getApiConfig().apiBase;
  }

  public buildUrl(path: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    const { backendOrigin, apiBase } = getApiConfig();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    let url = '';
    if (cleanPath === '/health') {
      url = backendOrigin ? `${backendOrigin}/health` : '/health';
    } else if (cleanPath.startsWith('/api/v1/')) {
      const subPath = cleanPath.slice('/api/v1'.length);
      url = `${apiBase}${subPath}`;
    } else {
      url = `${apiBase}${cleanPath}`;
    }

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    return url;
  }

  public async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, options.params);
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Attach JWT Bearer token if available and not skipped
    if (!options.skipAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Attach Idempotency-Key if provided
    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    // Set JSON header if not sending FormData
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Includes HttpOnly cookies (cirs_refresh_token)
      });

      // Handle 401 Unauthorized with token refresh attempt (prevent infinite refresh loops)
      if (
        response.status === 401 &&
        !options.skipAuth &&
        path !== '/auth/login' &&
        path !== '/auth/refresh' &&
        path !== '/auth/register'
      ) {
        const refreshed = await this.handleTokenRefresh();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
          });
          return this.parseResponse<T>(retryResponse);
        }
      }

      return this.parseResponse<T>(response);
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      // If network fails (e.g. backend offline or tunnel expired)
      throw new ApiError(
        err.message || 'Network request failed. Is the backend server reachable?',
        'NETWORK_ERROR',
        0,
        [err.message]
      );
    }
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) {
      return null as unknown as T;
    }

    let payload: any;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
    } else {
      payload = await response.text();
    }

    if (!response.ok) {
      // Parse CIRS backend standard error envelope: { error: { code, message, details } }
      const errorData = (payload as ApiErrorEnvelope)?.error;
      const code = errorData?.code || `HTTP_${response.status}`;
      const message = errorData?.message || response.statusText || 'Request failed';
      const details = errorData?.details;

      throw new ApiError(message, code, response.status, details);
    }

    return payload as T;
  }

  private async handleTokenRefresh(): Promise<boolean> {
    if (this.isRefreshing) {
      return new Promise<boolean>((resolve) => {
        this.refreshSubscribers.push((newToken: string) => {
          resolve(!!newToken);
        });
      });
    }

    this.isRefreshing = true;
    try {
      const refreshUrl = this.buildUrl('/auth/refresh');
      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        this.setAccessToken(null);
        this.notifyRefreshSubscribers('');
        return false;
      }

      const data = await response.json();
      if (data?.accessToken) {
        this.setAccessToken(data.accessToken);
        this.notifyRefreshSubscribers(data.accessToken);
        return true;
      }
      return false;
    } catch {
      this.setAccessToken(null);
      this.notifyRefreshSubscribers('');
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  private notifyRefreshSubscribers(newToken: string) {
    this.refreshSubscribers.forEach((cb) => cb(newToken));
    this.refreshSubscribers = [];
  }

  public get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  public post<T>(path: string, body?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public patch<T>(path: string, body?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  public delete<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  public upload<T>(path: string, formData: FormData, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: formData,
    });
  }
}

export const apiClient = new ApiClient();
