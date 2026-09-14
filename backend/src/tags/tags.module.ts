import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './tag.js';
import { TagsController } from './tags.controller.js';
import { TagsService } from './tags.service.js';
import { AuthenticationModule } from '../authentication/authentication.module.js';

@Module({
  imports: [AuthenticationModule, TypeOrmModule.forFeature([Tag])],
  controllers: [TagsController],
  providers: [TagsService],
})
export class TagsModule {}
