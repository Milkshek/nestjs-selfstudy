import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import {CommentsController} from "./comments.controller.js";
import { CommentsAdministrationController } from './comments-administration.controller.js';
import {CommentsService} from "./comments.service.js";
import Comment from "./comment.js";
import {ArticlesModule} from "../articles/articles.module.js";

@Module({
  imports: [AuthenticationModule, ArticlesModule, TypeOrmModule.forFeature([Comment])],
  controllers: [CommentsController, CommentsAdministrationController],
  providers: [CommentsService],
})
export class CommentsModule {}
