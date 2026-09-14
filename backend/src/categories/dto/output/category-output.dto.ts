import type { Category } from '../../category.js';

export class CategoryOutputDto {
  id: number;
  name: string;
  slug: string;

  static hydrate(category: Category): CategoryOutputDto {
    const output = new CategoryOutputDto();
    output.id = category.id;
    output.name = category.name;
    output.slug = category.slug;
    return output;
  }
}
