import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsController } from './statistics.controller.js';
import { StatisticsService } from './statistics.service.js';

describe('StatisticsController', () => {
  let controller: StatisticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatisticsController],
      providers: [
        {
          provide: StatisticsService,
          useValue: { countArticles: vi.fn().mockResolvedValue(2) },
        },
      ],
    }).compile();

    controller = module.get<StatisticsController>(StatisticsController);
  });

  it('returns the number of articles', async () => {
    await expect(controller.countArticles()).resolves.toEqual({ count: 2 });
  });
});
