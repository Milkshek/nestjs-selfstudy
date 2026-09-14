import { appDataSource } from './data-source.js';
import { seedUsers } from './seeds/users.seed.js';
import { seedArticles } from './seeds/articles.seed.js';
import { seedComments } from './seeds/comments.seed.js';
import { seedCategories } from './seeds/categories.seed.js';
import { seedTags } from './seeds/tags.seed.js';

async function seed(): Promise<void> {
  await appDataSource.initialize();

  try {
    await seedUsers(appDataSource);
    await seedCategories(appDataSource);
    await seedTags(appDataSource);
    await seedArticles(appDataSource);
    await seedComments(appDataSource);
  } finally {
    await appDataSource.destroy();
  }
}

void seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
