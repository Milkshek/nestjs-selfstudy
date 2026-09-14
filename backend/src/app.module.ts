import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticlesModule } from './articles/articles.module.js';
import { databaseOptions } from './database/data-source.js';
import { HealthModule } from './health/health.module.js';
import {StatisticsModule} from "./statistics/statistics.module.js";
import { UsersModule } from './users/users.module.js';
import { AuthenticationModule } from './authentication/authentication.module.js';
import {CommentsModule} from "./comments/comments.module.js";
import { CategoriesModule } from './categories/categories.module.js';
import { TagsModule } from './tags/tags.module.js';
import { validateEnvironment } from './config/environment.validation.js';
import { HttpRequestLoggingMiddleware } from './common/middleware/http-request-logging.middleware.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    TypeOrmModule.forRoot(databaseOptions),
    HealthModule,
    ArticlesModule,
    StatisticsModule,
    UsersModule,
    AuthenticationModule,
    CommentsModule,
    CategoriesModule,
    TagsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpRequestLoggingMiddleware).forRoutes('*');
  }
}
