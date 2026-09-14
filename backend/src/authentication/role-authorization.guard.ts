import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request as ExpressRequest } from 'express';
import type { User } from '../users/user.js';
import type { UserRole } from '../users/user-role.js';
import { REQUIRED_ROLES_KEY } from './required-roles.decorator.js';

@Injectable()
export class RoleAuthorizationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(REQUIRED_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<ExpressRequest & { user?: User }>();

    return request.user ? requiredRoles.includes(request.user.role) : false;
  }
}
