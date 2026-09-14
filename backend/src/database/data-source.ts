import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import { Article } from '../articles/article.js';
import { User } from '../users/user.js';
import Comment from '../comments/comment.js';
import { Category } from '../categories/category.js';
import { Tag } from '../tags/tag.js';
import { InitialSchema1788307200000 } from './migrations/initial-schema.migration.js';
import { AddUserRole1788393600000 } from './migrations/add-user-role.migration.js';
import { AddArticleImage1788480000000 } from './migrations/add-article-image.migration.js';

const isTestEnvironment = process.env.NODE_ENV === 'test';

export const databaseOptions: DataSourceOptions = {
  type: 'sqlite',
  database: isTestEnvironment ? 'test-data/blog-test.sqlite' : 'data/blog.sqlite',
  entities: [Article, User, Comment, Category, Tag],
  migrations: [InitialSchema1788307200000, AddUserRole1788393600000, AddArticleImage1788480000000],
  migrationsRun: !isTestEnvironment,
  dropSchema: false,
  synchronize: false,
};

export const appDataSource = new DataSource(databaseOptions);
