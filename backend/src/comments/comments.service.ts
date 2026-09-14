import {ForbiddenException, Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {type Repository } from 'typeorm';
import Comment from './comment.js';
import {Article} from "../articles/article.js";
import {User} from "../users/user.js";
import { UserRole } from '../users/user-role.js';

export type CommentContentData = Pick<Comment, 'content'>;

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  findAllByArticle(articleId: number): Promise<Comment[]> {
    return this.commentRepository.find({
      where: {
        article: { id: articleId },
      },
      relations: {
        author: true,
      },
    });
  }

  findAll(): Promise<Comment[]> {
    return this.commentRepository.find({ relations: { author: true, article: true } });
  }

  create(article: Article, author: User, data: CommentContentData): Promise<Comment> {
    return this.commentRepository.save(this.commentRepository.create({
      article,
      author,
      ...data,
    }));
  }

  async update(id: number, data: CommentContentData, author: User, articleId: number): Promise<Comment | null> {
    let comment = await this.commentRepository.findOne({
      where: { id },
      relations: {
        author: true,
        article: true,
      },
    });

    if(!comment) {
      return null;
    }

    this.assertOwnership(comment, author);
    this.assertArticleLink(comment, articleId);

    comment.content = data.content;

    return this.commentRepository.save(comment);
  }

  async delete(id: number, author: User, articleId: number): Promise<boolean> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: {
        author: true,
        article: true,
      },
    });

    if (!comment) {
      return false;
    }

    this.assertOwnership(comment, author);
    this.assertArticleLink(comment, articleId);
    await this.commentRepository.softRemove(comment);

    return true;
  }

  private assertArticleLink(comment: Comment, articleId: number): void {
    if (comment.article.id !== articleId) {
      throw new ForbiddenException('The comment does not belong to the article');
    }
  }

  private assertOwnership(comment: Comment, author: User): void {
    if (author.role !== UserRole.ADMIN && comment.author?.id !== author.id) {
      throw new ForbiddenException('Only the author can modify this article');
    }
  }
}
