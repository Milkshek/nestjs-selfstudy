import type { DataSource } from 'typeorm';
import { User } from '../../users/user.js';
import Comment from "../../comments/comment.js";
import {Article} from "../../articles/article.js";

export async function seedComments(dataSource: DataSource): Promise<void> {
  const commentRepository = dataSource.getRepository(Comment);
  const articlesRepository = dataSource.getRepository(Article);
  const usersRepository = dataSource.getRepository(User);

  if (await commentRepository.existsBy({})) {
    return;
  }

  const author = await usersRepository.findOneByOrFail({ email: 'reader@example.com' });

  await commentRepository.save([
    commentRepository.create({
      article: await articlesRepository.findOneByOrFail({ id: 1 }),
      content: 'This comment was created by the development seed.',
      author,
      createdAt: new Date()
    }),
    commentRepository.create({
      article: await articlesRepository.findOneByOrFail({ id: 2 }),
      content: 'This comment demonstrates persisted development data.',
      author,
      createdAt: new Date()
    }),
  ]);
}
