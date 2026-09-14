import {CommentsController} from "./comments.controller.js";
import {CommentsService} from "./comments.service.js";
import {Test, TestingModule} from "@nestjs/testing";
import {PassportModule} from "@nestjs/passport";
import {JwtAuthenticationGuard} from "../authentication/jwt-authentication.guard.js";
import {User} from "../users/user.js";
import Comment from "./comment.js";
import {CommentOutputDto} from "./dto/output/comment-output.dto.js";
import { ArticlesService } from '../articles/articles.service.js';
import {Article} from "../articles/article.js";
import type {Request as ExpressRequest} from "express";
import {NotFoundException} from "@nestjs/common";
import {InputCommentDto} from "./dto/input/input-comment.dto";

describe('CommentsController', () => {
  let controller: CommentsController;
  let articlesService: Pick<ArticlesService, 'findOne' | 'findPublished'>;
  let service: Pick<CommentsService, 'findAllByArticle' | 'create' | 'update' | 'delete'>;
  const request = {
    user: { id: 1, email: 'author@example.com', passwordHash: 'hash' },
  } as ExpressRequest & { user: User };

  beforeEach(async () => {
    service = {
      findAllByArticle: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    articlesService = { findOne: vi.fn(), findPublished: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({})],
      controllers: [CommentsController],
      providers: [
        { provide: ArticlesService, useValue: articlesService },
        { provide: CommentsService, useValue: service },
        { provide: JwtAuthenticationGuard, useValue: { canActivate: vi.fn() } },
      ],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
  });

  it('returns the comment list by article from the service', async () => {
    let user = { id: 1, email: 'test@mail.com', passwordHash: 'test'} as User;
    let article = { id: 1, title: 'Test', content: 'Test', author: user} as Article;
    let comment = {id: 1, content: 'test', author: user, article, createdAt: new Date()} as Comment;
    let expected = CommentOutputDto.hydrate(comment);
    vi.mocked(articlesService.findPublished).mockResolvedValue(article);
    vi.mocked(service.findAllByArticle).mockResolvedValue([comment]);
    const hydrate = vi.spyOn(CommentOutputDto, 'hydrate');
    await expect(controller.findByArticle(1)).resolves.toEqual([expected]);
    expect(hydrate).toHaveBeenCalledWith(comment);
  });

  it('add and return comment', async () => {
    let user = { id: 1, email: 'test@mail.com', passwordHash: 'test'} as User;
    let article = { id: 1, title: 'Test', content: 'Test', author: user} as Article;
    let comment = {id: 1, content: 'test'} as Comment;
    let savedComment = {id: 1, author: user, article, content: 'test', createdAt: new Date()} as Comment;
    let expected = CommentOutputDto.hydrate(savedComment);

    vi.mocked(articlesService.findPublished).mockResolvedValue(article);
    vi.mocked(service.create).mockResolvedValue(savedComment);

    const hydrate = vi.spyOn(CommentOutputDto, 'hydrate');

    await expect(controller.createComment(article.id, {content: comment.content} as InputCommentDto, request)).resolves.toEqual(expected);

    expect(hydrate).toHaveBeenCalledWith(savedComment);
    expect(articlesService.findPublished).toHaveBeenCalledWith(article.id);
    expect(service.create).toHaveBeenCalledWith(
        article,
        request.user,
        { content: 'test' },
    );
  });

  it('return exception if article is not found', async () => {
    let user = { id: 1, email: 'test@mail.com', passwordHash: 'test'} as User;
    let article = { id: 1, title: 'Test', content: 'Test', author: user} as Article;
    let comment = {content: 'test'} as Comment;

    vi.mocked(articlesService.findPublished).mockResolvedValue(null);

    await expect(controller.createComment(article.id, comment, request)).rejects.toThrow(NotFoundException);
  });

  it('update and return comment', async () => {
    let user = { id: 1, email: 'test@mail.com', passwordHash: 'test'} as User;
    let article = { id: 1, title: 'Test', content: 'Test', author: user} as Article;
    let comment = {id: 1, content: 'test'} as Comment;
    let savedComment = {id: 1, author: user, article, content: 'test', createdAt: new Date()} as Comment;
    let expected = CommentOutputDto.hydrate(savedComment);
    vi.mocked(articlesService.findOne).mockResolvedValue(article);
    vi.mocked(service.update).mockResolvedValue(savedComment);
    const hydrate = vi.spyOn(CommentOutputDto, 'hydrate');
    await expect(controller.updateComment(article.id, comment.id, {content: comment.content} as InputCommentDto, request)).resolves.toEqual(expected);
    expect(hydrate).toHaveBeenCalledWith(savedComment);
    expect(articlesService.findOne).toHaveBeenCalledWith(article.id);
    expect(service.update).toHaveBeenCalledWith(
        comment.id,
        { content: 'test' },
        request.user,
        article.id,
    );
  });

  it('return exception if article is not found', async () => {
    let user = { id: 1, email: 'test@mail.com', passwordHash: 'test'} as User;
    let article = { id: 1, title: 'Test', content: 'Test', author: user} as Article;
    let comment = {id: 1, content: 'test'} as Comment;

    vi.mocked(articlesService.findOne).mockResolvedValue(null)

    await expect(controller.updateComment(article.id, comment.id, {content: comment.content} as InputCommentDto, request)).rejects.toThrow(NotFoundException);
  });

  it('return exception if comment is not found', async () => {
    let user = { id: 1, email: 'test@mail.com', passwordHash: 'test'} as User;
    let article = { id: 1, title: 'Test', content: 'Test', author: user} as Article;
    let comment = {id: 1, content: 'test'} as Comment;
    vi.mocked(articlesService.findOne).mockResolvedValue(article);
    vi.mocked(service.update).mockResolvedValue(null);

    await expect(controller.updateComment(article.id, comment.id, {content: comment.content} as InputCommentDto, request)).rejects.toThrow(NotFoundException);
  });

  it('soft deletes a comment', async () => {
    const article = { id: 1, title: 'Test', content: 'Test', author: request.user } as Article;
    vi.mocked(articlesService.findOne).mockResolvedValue(article);
    vi.mocked(service.delete).mockResolvedValue(true);

    await expect(controller.deleteComment(article.id, 2, request)).resolves.toBeUndefined();

    expect(articlesService.findOne).toHaveBeenCalledWith(article.id);
    expect(service.delete).toHaveBeenCalledWith(2, request.user, article.id);
  });

  it('returns an exception when deleting a missing comment', async () => {
    const article = { id: 1, title: 'Test', content: 'Test', author: request.user } as Article;
    vi.mocked(articlesService.findOne).mockResolvedValue(article);
    vi.mocked(service.delete).mockResolvedValue(false);

    await expect(controller.deleteComment(article.id, 2, request)).rejects.toThrow(NotFoundException);
  });
});
