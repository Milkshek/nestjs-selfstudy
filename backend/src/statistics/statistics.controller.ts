import {
  Controller,
  Get,
} from '@nestjs/common';

import {StatisticsService} from "./statistics.service.js";
import { ApiTags } from '@nestjs/swagger';

@Controller('statistics')
@ApiTags('Statistics')
export class StatisticsController {
  constructor(private readonly statisticService: StatisticsService) {}

  @Get('articles-count')
  async countArticles(): Promise<{ count: number }> {
    return { count: await this.statisticService.countArticles() };
  }
}
