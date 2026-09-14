import Joi from 'joi';

interface EnvironmentVariables {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  JWT_SECRET: string;
  BCRYPT_SALT_ROUNDS: number;
  CORS_ORIGINS?: string;
  LOG_LEVELS?: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX: number;
  REFRESH_TOKEN_TTL_SECONDS: number;
}

export function validateEnvironment(configuration: Record<string, unknown>): EnvironmentVariables {
  const { error, value } = Joi.object<EnvironmentVariables>({
    NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
    PORT: Joi.number().port().default(3000),
    JWT_SECRET: Joi.string().min(16).required(),
    BCRYPT_SALT_ROUNDS: Joi.number().integer().min(4).max(15).default(12),
    CORS_ORIGINS: Joi.string().optional(),
    LOG_LEVELS: Joi.string().optional(),
    RATE_LIMIT_WINDOW_MS: Joi.number().integer().positive().default(60_000),
    RATE_LIMIT_MAX: Joi.number().integer().positive().default(100),
    REFRESH_TOKEN_TTL_SECONDS: Joi.number().integer().positive().default(604_800),
  })
    .unknown(true)
    .validate(configuration, { abortEarly: false, convert: true });

  if (error) {
    throw new Error(`Environment validation error: ${error.message}`);
  }

  return value;
}
