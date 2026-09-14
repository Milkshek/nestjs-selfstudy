import {UserOutputDto} from "../../../users/dto/output/user-output.dto.js";
import Comment from "../../comment.js";

export class CommentOutputDto {
  id: number;
  content: string;
  createdAt: Date;
  author: UserOutputDto;

  static hydrate(comment: Comment): CommentOutputDto {
    const output = new CommentOutputDto();

    output.id = comment.id;
    output.content = comment.content;
    output.createdAt = comment.createdAt;
    output.author = UserOutputDto.hydrate(comment.author);

    return output;
  }
}
