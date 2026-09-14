import { INestApplication, LogLevel, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { static as serveStatic } from 'express';

const defaultLogLevels: LogLevel[] = ['log', 'warn', 'error'];

function isLogLevel(value: string): value is LogLevel {
  return ['log', 'fatal', 'error', 'warn', 'debug', 'verbose'].includes(value);
}

function getPositiveInteger(value: string | undefined, fallback: number): number {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

export function getLogLevels(): LogLevel[] {
  const logLevels = process.env.LOG_LEVELS
    ?.split(',')
    .map((level) => level.trim())
    .filter(isLogLevel);

  return logLevels?.length ? logLevels : defaultLogLevels;
}

export function configureApplication(app: INestApplication): void {
  const isProduction = process.env.NODE_ENV === 'production';

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use('/uploads', serveStatic('uploads'));
  app.use(cookieParser());

  app.use(
    helmet(
      isProduction
        ? {}
        : {
            contentSecurityPolicy: false,
            strictTransportSecurity: false,
          },
    ),
  );

  app.use(
    rateLimit({
      windowMs: getPositiveInteger(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
      limit: getPositiveInteger(process.env.RATE_LIMIT_MAX, 100),
      legacyHeaders: false,
      standardHeaders: 'draft-8',
    }),
  );

  const corsOrigins = process.env.CORS_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigins?.length ? corsOrigins : false, credentials: Boolean(corsOrigins?.length) });
  app.enableShutdownHooks();

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('BlogNest API')
      .setDescription('REST API for BlogNest')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, document);
  }
}
