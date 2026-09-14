import { Body, Controller, Get, HttpCode, Patch, Post, Request, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { User } from '../users/user.js';
import { UserOutputDto } from '../users/dto/output/user-output.dto.js';
import { AuthenticationService } from './authentication.service.js';
import { LoginDto } from './dto/input/login.dto.js';
import { RegisterDto } from './dto/input/register.dto.js';
import { AuthenticationTokenOutputDto } from './dto/output/authentication-token-output.dto.js';
import { JwtAuthenticationGuard } from './jwt-authentication.guard.js';
import { ChangePasswordDto } from './dto/input/change-password.dto.js';

@Controller('authentication')
@ApiTags('Authentication')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<UserOutputDto> {
    return UserOutputDto.hydrate(await this.authenticationService.register(registerDto));
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: ExpressResponse,
  ): Promise<AuthenticationTokenOutputDto> {
    const tokens = await this.authenticationService.login(loginDto);
    this.setRefreshTokenCookie(response, tokens.refreshToken);

    return AuthenticationTokenOutputDto.hydrate(tokens.accessToken);
  }

  @Post('refresh')
  async refresh(
    @Request() request: ExpressRequest,
    @Res({ passthrough: true }) response: ExpressResponse,
  ): Promise<AuthenticationTokenOutputDto> {
    const tokens = await this.authenticationService.refresh(request.cookies?.refreshToken);
    this.setRefreshTokenCookie(response, tokens.refreshToken);

    return AuthenticationTokenOutputDto.hydrate(tokens.accessToken);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Request() request: ExpressRequest, @Res({ passthrough: true }) response: ExpressResponse): Promise<void> {
    await this.authenticationService.logout(request.cookies?.refreshToken);
    response.clearCookie('refreshToken', this.clearRefreshTokenCookieOptions);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get('me')
  @ApiBearerAuth()
  getCurrentUser(@Request() request: ExpressRequest & { user: User }): UserOutputDto {
    return UserOutputDto.hydrate(request.user);
  }

  @Patch('password')
  @UseGuards(JwtAuthenticationGuard)
  @HttpCode(204)
  @ApiBearerAuth()
  async changePassword(@Body() data: ChangePasswordDto, @Request() request: ExpressRequest & { user: User }): Promise<void> {
    await this.authenticationService.changePassword(request.user, data);
  }

  private setRefreshTokenCookie(response: ExpressResponse, refreshToken: string): void {
    response.cookie('refreshToken', refreshToken, this.refreshTokenCookieOptions);
  }

  private get refreshTokenCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/authentication',
      maxAge: Number(this.configService.get('REFRESH_TOKEN_TTL_SECONDS') ?? 604_800) * 1_000,
    };
  }

  private get clearRefreshTokenCookieOptions(): CookieOptions {
    const { maxAge: _maxAge, ...cookieOptions } = this.refreshTokenCookieOptions;

    return cookieOptions;
  }
}
