import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpRequestLoggingMiddleware } from './http-request-logging.middleware.js';

describe('HttpRequestLoggingMiddleware', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs the request method, path, response status and duration after the response ends', () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    vi.spyOn(Date, 'now').mockReturnValueOnce(1_000).mockReturnValueOnce(1_014);
    const middleware = new HttpRequestLoggingMiddleware();
    let responseFinished: (() => void) | undefined;

    middleware.use(
      { method: 'GET', originalUrl: '/articles?search=private', path: '/articles' } as never,
      {
        statusCode: 200,
        once: vi.fn((event: string, listener: () => void) => {
          if (event === 'finish') {
            responseFinished = listener;
          }
        }),
      } as never,
      vi.fn(),
    );
    responseFinished?.();

    expect(log).toHaveBeenCalledWith('GET /articles 200 14ms');
  });
});
