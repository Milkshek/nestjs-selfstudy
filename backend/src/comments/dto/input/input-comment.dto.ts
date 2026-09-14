import { IsNotEmpty, IsString } from 'class-validator';

export class InputCommentDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}
