import type { Article } from '../../article.js';
import { ArticleOutputDto } from './article-output.dto.js';
import { ApiProperty } from '@nestjs/swagger';

export class PaginatedArticlesOutputDto {
  @ApiProperty({ type: () => [ArticleOutputDto] })
  data: ArticleOutputDto[];

  @ApiProperty({
    type: 'object',
    properties: {
      page: { type: 'number' },
      limit: { type: 'number' },
      total: { type: 'number' },
      totalPages: { type: 'number' },
    },
  })
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  static hydrate(articles: Article[], total: number, page: number, limit: number): PaginatedArticlesOutputDto {
    const output = new PaginatedArticlesOutputDto();
    output.data = articles.map((article) => ArticleOutputDto.hydrate(article));
    output.meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return output;
  }
}
