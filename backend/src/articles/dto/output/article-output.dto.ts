import type { Article } from '../../article.js';
import { CategoryOutputDto } from '../../../categories/dto/output/category-output.dto.js';
import { TagOutputDto } from '../../../tags/dto/output/tag-output.dto.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ArticleOutputDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiPropertyOptional({ nullable: true })
  imagePath: string | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  publishedAt: Date | null;

  @ApiPropertyOptional({ type: () => CategoryOutputDto, nullable: true })
  category: CategoryOutputDto | null;

  @ApiProperty({ type: () => [TagOutputDto] })
  tags: TagOutputDto[];

  static hydrate(article: Article): ArticleOutputDto {
    const output = new ArticleOutputDto();

    output.id = article.id;
    output.title = article.title;
    output.content = article.content;
    output.imagePath = article.imagePath;
    output.publishedAt = article.publishedAt;
    output.category = article.category ? CategoryOutputDto.hydrate(article.category) : null;
    output.tags = article.tags?.map(TagOutputDto.hydrate) ?? [];

    return output;
  }
}
