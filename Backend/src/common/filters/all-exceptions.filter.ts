import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any[];
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: any[] | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, any>;
        message = body.message || exception.message;
        code = body.error || HttpStatus[status] || 'HTTP_ERROR';
        if (Array.isArray(body.message)) {
          details = body.message;
          message = 'Validation failed';
          code = 'VALIDATION_ERROR';
        } else if (body.details) {
          details = body.details;
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled Exception on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
      message = exception.message;
      code = 'INTERNAL_ERROR';
    } else {
      this.logger.error(`Unhandled non-error exception on ${request.method} ${request.url}`, exception);
    }

    const errorPayload: ApiErrorResponse = {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    };

    response.status(status).send(errorPayload);
  }
}
