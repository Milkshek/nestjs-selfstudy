import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1788307200000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "email" varchar NOT NULL UNIQUE,
        "password_hash" varchar NOT NULL,
        "refresh_token_hash" varchar,
        "refresh_token_expires_at" datetime,
        "deleted_at" datetime
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar NOT NULL UNIQUE,
        "slug" varchar NOT NULL UNIQUE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "articles" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "title" varchar NOT NULL,
        "content" varchar NOT NULL,
        "author_id" integer NOT NULL,
        "category_id" integer,
        "published_at" datetime,
        "updated_at" datetime,
        "deleted_at" datetime,
        FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE RESTRICT,
        FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "tags" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar NOT NULL UNIQUE,
        "slug" varchar NOT NULL UNIQUE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "comments" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "content" text NOT NULL,
        "author_id" integer NOT NULL,
        "article_id" integer NOT NULL,
        "created_at" datetime NOT NULL,
        "updated_at" datetime,
        "deleted_at" datetime,
        FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE RESTRICT,
        FOREIGN KEY ("article_id") REFERENCES "articles" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "article_tags" (
        "articleId" integer NOT NULL,
        "tagId" integer NOT NULL,
        PRIMARY KEY ("articleId", "tagId"),
        FOREIGN KEY ("articleId") REFERENCES "articles" ("id") ON DELETE CASCADE,
        FOREIGN KEY ("tagId") REFERENCES "tags" ("id") ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "comments"');
    await queryRunner.query('DROP TABLE "article_tags"');
    await queryRunner.query('DROP TABLE "tags"');
    await queryRunner.query('DROP TABLE "articles"');
    await queryRunner.query('DROP TABLE "categories"');
    await queryRunner.query('DROP TABLE "users"');
  }
}
