import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import type { User } from '../users/user.js';
import { UsersService } from '../users/users.service.js';
import type { LoginDto } from './dto/input/login.dto.js';
import type { RegisterDto } from './dto/input/register.dto.js';
import type { ChangePasswordDto } from './dto/input/change-password.dto.js';

interface AuthenticationTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(data: RegisterDto): Promise<User> {
    if (await this.usersService.findByEmail(data.email)) {
      throw new ConflictException(`User ${data.email} already exists`);
    }

    return this.usersService.create({
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, this.passwordHashRounds),
    });
  }

  async login(data: LoginDto): Promise<AuthenticationTokens> {
    const user = await this.usersService.findByEmail(data.email);

    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createTokens(user);
  }

  async refresh(refreshToken: string | undefined): Promise<AuthenticationTokens> {
    const user = await this.findUserByRefreshToken(refreshToken);

    return this.createTokens(user);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const user = await this.usersService.findByRefreshTokenHash(this.hashRefreshToken(refreshToken));

    if (user) {
      await this.usersService.clearRefreshToken(user);
    }
  }

  async changePassword(user: User, data: ChangePasswordDto): Promise<void> {
    if (!(await bcrypt.compare(data.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    await this.usersService.updatePassword(user, await bcrypt.hash(data.newPassword, this.passwordHashRounds));
    await this.usersService.clearRefreshToken(user);
  }

  private get passwordHashRounds(): number {
    return Number(this.configService.get('BCRYPT_SALT_ROUNDS') ?? 12);
  }

  private async createTokens(user: User): Promise<AuthenticationTokens> {
    const refreshToken = randomBytes(64).toString('base64url');
    const refreshTokenExpiresAt = new Date(Date.now() + this.refreshTokenTtlSeconds * 1_000);

    await this.usersService.updateRefreshToken(
      user,
      this.hashRefreshToken(refreshToken),
      refreshTokenExpiresAt,
    );

    return {
      accessToken: await this.jwtService.signAsync({ sub: user.id, email: user.email }),
      refreshToken,
    };
  }

  private async findUserByRefreshToken(refreshToken: string | undefined): Promise<User> {
    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    const user = await this.usersService.findByRefreshTokenHash(this.hashRefreshToken(refreshToken));

    if (!user || !user.refreshTokenExpiresAt || user.refreshTokenExpiresAt <= new Date()) {
      throw new UnauthorizedException();
    }

    return user;
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private get refreshTokenTtlSeconds(): number {
    return Number(this.configService.get('REFRESH_TOKEN_TTL_SECONDS') ?? 604_800);
  }
}
