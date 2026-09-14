import { describe, expect, it } from 'vitest';
import { validateEnvironment } from './environment.validation.js';

describe('validateEnvironment', () => {
  it('applies defaults and converts numeric settings', () => {
    expect(validateEnvironment({ JWT_SECRET: 'test-only-jwt-secret' })).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      BCRYPT_SALT_ROUNDS: 12,
      RATE_LIMIT_WINDOW_MS: 60_000,
      RATE_LIMIT_MAX: 100,
    });
  });

  it('rejects an invalid password hash cost', () => {
    expect(() => validateEnvironment({ JWT_SECRET: 'test-only-jwt-secret', BCRYPT_SALT_ROUNDS: '0' })).toThrow(
      'BCRYPT_SALT_ROUNDS',
    );
  });

  it('rejects a missing JWT secret', () => {
    expect(() => validateEnvironment({})).toThrow('JWT_SECRET');
  });
});
