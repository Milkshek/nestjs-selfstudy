import { IsBoolean } from 'class-validator';

export class UpdateArticlePublicationDto {
  @IsBoolean()
  published!: boolean;
}
