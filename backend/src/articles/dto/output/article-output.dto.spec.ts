import { Article } from '../../article.js';
import { ArticleOutputDto } from './article-output.dto.js';

describe('ArticleOutputDto', () => {
  it('hydrates only the public article fields', () => {
    const article = Object.assign(new Article(), {
      id: 1,
      title: 'NestJS',
      content: 'A Node.js framework',
      publishedAt: undefined,
      category: null,
      tags: [],
      internalNote: 'not public',
    });

    const output = ArticleOutputDto.hydrate(article);

    expect(output).toBeInstanceOf(ArticleOutputDto);
    expect(output).toEqual({
      id: 1,
      title: 'NestJS',
      content: 'A Node.js framework',
      publishedAt: undefined,
      category: null,
      tags: [],
    });
    expect(output).not.toHaveProperty('internalNote');
  });
});
