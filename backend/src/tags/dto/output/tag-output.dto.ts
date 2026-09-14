import type { Tag } from '../../tag.js';

export class TagOutputDto {
  id: number;
  name: string;
  slug: string;

  static hydrate(tag: Tag): TagOutputDto {
    return Object.assign(new TagOutputDto(), tag);
  }
}
