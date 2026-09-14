import {User} from "../../../users/user.js";
import Comment from "../../comment.js";
import {CommentOutputDto} from "./comment-output.dto.js";
import {UserOutputDto} from "../../../users/dto/output/user-output.dto.js";

describe('CommentOutputDto', () => {
  let user = { id: 1, email: 'test@mail.com', passwordHash: 'test'} as User;
  let comment = {id: 1, content: 'test', author: user, article: {id: 1}, createdAt: new Date()} as Comment;

  it('hydrates comment', () => {
    const output = CommentOutputDto.hydrate(comment);
    expect(output).toBeInstanceOf(CommentOutputDto);
    expect(output).toEqual({
      id: 1,
      content: 'test',
      author: UserOutputDto.hydrate(user),
      createdAt: comment.createdAt,
    });
  });
})
