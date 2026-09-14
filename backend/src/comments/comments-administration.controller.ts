import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard.js';
import { RequireRoles } from '../authentication/required-roles.decorator.js';
import { RoleAuthorizationGuard } from '../authentication/role-authorization.guard.js';
import { UserRole } from '../users/user-role.js';
import { CommentsService } from './comments.service.js';
import { ModerationCommentOutputDto } from './dto/output/moderation-comment-output.dto.js';
@Controller('admin/comments')
export class CommentsAdministrationController {
  constructor(private readonly commentsService: CommentsService) {}
  @Get() @UseGuards(JwtAuthenticationGuard, RoleAuthorizationGuard) @RequireRoles(UserRole.ADMIN) @ApiBearerAuth()
  async findAll(): Promise<ModerationCommentOutputDto[]> { return (await this.commentsService.findAll()).map(ModerationCommentOutputDto.hydrate); }
}
