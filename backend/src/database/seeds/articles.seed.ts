import type { DataSource } from 'typeorm';
import { Article } from '../../articles/article.js';
import { User } from '../../users/user.js';
import { Category } from '../../categories/category.js';

export async function seedArticles(dataSource: DataSource): Promise<void> {
  const articlesRepository = dataSource.getRepository(Article);
  const usersRepository = dataSource.getRepository(User);
  const categoriesRepository = dataSource.getRepository(Category);

  if (await articlesRepository.existsBy({})) {
    return;
  }

  const author = await usersRepository.findOneByOrFail({ email: 'reader@example.com' });
  const nestjs = await categoriesRepository.findOneByOrFail({ slug: 'nestjs' });
  const typeorm = await categoriesRepository.findOneByOrFail({ slug: 'typeorm' });

  await articlesRepository.save([
    articlesRepository.create({
      title: 'Welcome to BlogNest',
      content: 'This article was created by the development seed.',
      author,
      category: nestjs,
      publishedAt: new Date(),
    }),
    articlesRepository.create({
      title: 'NestJS and TypeORM',
      content: 'This article demonstrates persisted development data.',
      author,
      category: typeorm,
      publishedAt: new Date(),
    }),
  ]);
}
