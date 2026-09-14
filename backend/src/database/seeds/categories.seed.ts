import type { DataSource } from 'typeorm';
import { Category } from '../../categories/category.js';

export async function seedCategories(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository(Category);
  if (await repository.existsBy({})) {
    return;
  }

  await repository.save([
    repository.create({ name: 'NestJS', slug: 'nestjs' }),
    repository.create({ name: 'TypeORM', slug: 'typeorm' }),
  ]);
}
