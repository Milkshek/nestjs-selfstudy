import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const sortableArticleFields = ['id', 'title', 'publishedAt'] as const;
export type SortableArticleField = (typeof sortableArticleFields)[number];

export const sortDirections = ['ASC', 'DESC'] as const;
export type SortDirection = (typeof sortDirections)[number];

export class PaginationQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @IsIn(sortableArticleFields)
  sortBy: SortableArticleField = 'id';

  @IsIn(sortDirections)
  sortDirection: SortDirection = 'DESC';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tag?: string;
}
