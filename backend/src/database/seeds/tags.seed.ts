import type { DataSource } from 'typeorm';
import { Tag } from '../../tags/tag.js';

export async function seedTags(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository(Tag);
  if (!(await repository.existsBy({}))) {
    await repository.save([
      repository.create({ name: 'JavaScript', slug: 'javascript' }),
      repository.create({ name: 'Backend', slug: 'backend' }),
    ]);
  }
}
