import type { Repository } from 'typeorm';
import { UsersService } from './users.service.js';
import type { User } from './user.js';

describe('UsersService', () => {
  let repository: Pick<Repository<User>, 'create' | 'find' | 'findOneBy' | 'save' | 'softRemove'>;
  let service: UsersService;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      find: vi.fn(),
      findOneBy: vi.fn(),
      save: vi.fn(),
      softRemove: vi.fn(),
    };
    service = new UsersService(repository as Repository<User>);
  });

  it('creates a user through the repository', async () => {
    const user = { email: 'reader@example.com' } as User;
    const savedUser = { id: 1, ...user } as User;
    vi.mocked(repository.create).mockReturnValue(user);
    vi.mocked(repository.save).mockResolvedValue(savedUser);

    await expect(service.create(user)).resolves.toEqual(savedUser);
  });

  it('finds a user by email', async () => {
    const user = { id: 1, email: 'reader@example.com' } as User;
    vi.mocked(repository.findOneBy).mockResolvedValue(user);

    await expect(service.findByEmail(user.email)).resolves.toEqual(user);
  });

  it('soft deletes a user through the repository', async () => {
    const user = { id: 1, email: 'reader@example.com', passwordHash: 'hash' } as User;
    vi.mocked(repository.softRemove).mockResolvedValue(user);

    await expect(service.softRemove(user)).resolves.toEqual(user);
    expect(repository.softRemove).toHaveBeenCalledWith(user);
  });
});
