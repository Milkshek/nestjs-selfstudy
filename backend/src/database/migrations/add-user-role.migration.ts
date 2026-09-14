import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRole1788393600000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "role" varchar NOT NULL DEFAULT 'USER' CHECK ("role" IN ('USER', 'ADMIN'))
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "role"');
  }
}
