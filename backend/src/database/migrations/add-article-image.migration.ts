import type { MigrationInterface, QueryRunner } from 'typeorm';
export class AddArticleImage1788480000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> { await queryRunner.query('ALTER TABLE "articles" ADD COLUMN "image_path" varchar'); }
  async down(queryRunner: QueryRunner): Promise<void> { await queryRunner.query('ALTER TABLE "articles" DROP COLUMN "image_path"'); }
}
