import type { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/user.js';

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const usersRepository = dataSource.getRepository(User);

  if (await usersRepository.existsBy({})) {
    return;
  }

  await usersRepository.save(
    usersRepository.create({
      email: 'reader@example.com',
      passwordHash: await bcrypt.hash('development-password', 12),
    }),
  );
}
