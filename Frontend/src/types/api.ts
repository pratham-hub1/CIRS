export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: string[] | Record<string, any>;
  };
}

export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: string[] | Record<string, any>;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', statusCode: number = 500, details?: string[] | Record<string, any>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  total?: number;
}
