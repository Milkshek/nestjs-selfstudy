import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { User } from './user.js';

export type CreateUserData = Pick<User, 'email' | 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  findByRefreshTokenHash(refreshTokenHash: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ refreshTokenHash });
  }

  create(data: CreateUserData): Promise<User> {
    return this.usersRepository.save(this.usersRepository.create(data));
  }

  softRemove(user: User): Promise<User> {
    return this.usersRepository.softRemove(user);
  }

  updateRefreshToken(user: User, refreshTokenHash: string, refreshTokenExpiresAt: Date): Promise<User> {
    user.refreshTokenHash = refreshTokenHash;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;

    return this.usersRepository.save(user);
  }

  clearRefreshToken(user: User): Promise<User> {
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;

    return this.usersRepository.save(user);
  }

  updatePassword(user: User, passwordHash: string): Promise<User> {
    user.passwordHash = passwordHash;
    return this.usersRepository.save(user);
  }
}
