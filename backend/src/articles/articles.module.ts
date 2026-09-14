import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { Article } from './article.js';
import { Category } from '../categories/category.js';
import { Tag } from '../tags/tag.js';
import { ArticlesController } from './articles.controller.js';
import { ArticlesService } from './articles.service.js';
import { ArticleImagesService } from './article-images.service.js';

@Module({
  imports: [AuthenticationModule, TypeOrmModule.forFeature([Article, Category, Tag])],
  controllers: [ArticlesController],
  providers: [ArticlesService, ArticleImagesService],
  exports: [ArticlesService]
})
export class ArticlesModule {}
