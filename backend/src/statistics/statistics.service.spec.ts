import { StatisticsService } from './statistics.service.js';
import type { ArticlesService } from '../articles/articles.service.js';

describe('StatisticsService', () => {
  let service: StatisticsService;

  beforeEach(() => {
    service = new StatisticsService({
      countAll: vi.fn().mockResolvedValue(2),
    } as unknown as ArticlesService);
  });

  it('count existing articles', async () => {
    await expect(service.countArticles()).resolves.toEqual(2);
  });
});
