import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class HttpRequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(HttpRequestLoggingMiddleware.name);

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = Date.now();

    response.once('finish', () => {
      const duration = Date.now() - startedAt;
      this.logger.log(`${request.method} ${request.path} ${response.statusCode} ${duration}ms`);
    });

    next();
  }
}
