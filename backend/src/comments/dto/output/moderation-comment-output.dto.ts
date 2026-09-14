import { UserOutputDto } from '../../../users/dto/output/user-output.dto.js';
import type Comment from '../../comment.js';

export class ModerationCommentOutputDto {
  id: number;
  articleId: number;
  content: string;
  createdAt: Date;
  author: UserOutputDto;

  static hydrate(comment: Comment): ModerationCommentOutputDto {
    return Object.assign(new ModerationCommentOutputDto(), {
      id: comment.id,
      articleId: comment.article.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: UserOutputDto.hydrate(comment.author),
    });
  }
}
