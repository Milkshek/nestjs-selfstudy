import type {Repository} from "typeorm";
import {CommentsService, CommentContentData} from "./comments.service.js";
import type {Article} from "../articles/article.js";
import {User} from "../users/user.js";
import Comment from "./comment.js";

describe('CommentsService', () => {
  let commentRepository: Pick<
      Repository<Comment>,
      'find' | 'create' | 'save' | 'findOne' | 'softRemove'
  >;
  let service: CommentsService;
  let user = { id: 1, email: 'test@mail.com', passwordHash: 'test'} as User;

  beforeEach(() => {
    commentRepository = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      softRemove: vi.fn(),
    };
    service = new CommentsService(commentRepository as Repository<Comment>);
  });

  it('returns all comments by article from the repository', async () => {
    let article = { id: 1, title: 'Test', content: 'Test', author: user} as Article;
    const comments = [{ id: 1, content: 'Test', article: article, author: user, createdAt: new Date(), deletedAt: null } as Comment];
    vi.mocked(commentRepository.find).mockResolvedValue(comments);

    await expect(service.findAllByArticle(article.id)).resolves.toEqual(comments);
  });

  it('add and return comment', async () => {
    let article = { id: 1, title: 'Test', content: 'Test', author: user} as Article;
    let comment = { content: 'Test', article: article, author: user, createdAt: new Date(), deletedAt: null } as Comment;
    let savedComment = { id: 1, ...comment } as Comment;
    vi.mocked(commentRepository.create).mockReturnValue(comment);
    vi.mocked(commentRepository.save).mockResolvedValue(savedComment);

    await expect(service.create(article, user, {content: comment.content} as CommentContentData)).resolves.toEqual(savedComment);
  });

  it('update and return comment', async () => {
    let newContent = 'New content';
    let article = { id: 1, title: 'Test', content: 'Test', author: user} as Article;
    let comment = { id: 1, content: 'Test', article: article, author: user, createdAt: new Date(), deletedAt: null } as Comment;
    let savedComment = { content: newContent, updatedAt: new Date(), ...comment } as Comment;
    vi.mocked(commentRepository.findOne).mockResolvedValue(comment);
    vi.mocked(commentRepository.save).mockResolvedValue(savedComment);

    await expect(service.update(comment.id, {content: newContent} as CommentContentData, user, article.id)).resolves.toEqual(savedComment);
  });

  it('allows an administrator to update another user\'s comment', async () => {
    const administrator = { id: 2, email: 'administrator@example.com', passwordHash: 'test', role: 'ADMIN' } as User;
    const article = { id: 1, title: 'Test', content: 'Test', author: user } as Article;
    const comment = { id: 1, content: 'Test', article, author: user, createdAt: new Date(), deletedAt: null } as Comment;
    const savedComment = { ...comment, content: 'Moderated content' } as Comment;
    vi.mocked(commentRepository.findOne).mockResolvedValue(comment);
    vi.mocked(commentRepository.save).mockResolvedValue(savedComment);

    await expect(
      service.update(comment.id, { content: savedComment.content }, administrator, article.id),
    ).resolves.toEqual(savedComment);
  });

  it('soft deletes a comment', async () => {
    const article = { id: 1, title: 'Test', content: 'Test', author: user } as Article;
    const comment = { id: 1, content: 'Test', article, author: user, createdAt: new Date(), deletedAt: null } as Comment;
    vi.mocked(commentRepository.findOne).mockResolvedValue(comment);
    vi.mocked(commentRepository.softRemove).mockResolvedValue(comment);

    await expect(service.delete(comment.id, user, article.id)).resolves.toBe(true);
    expect(commentRepository.softRemove).toHaveBeenCalledWith(comment);
  });

  it('does not delete a missing comment', async () => {
    vi.mocked(commentRepository.findOne).mockResolvedValue(null);

    await expect(service.delete(1, user, 1)).resolves.toBe(false);
    expect(commentRepository.softRemove).not.toHaveBeenCalled();
  });
});
