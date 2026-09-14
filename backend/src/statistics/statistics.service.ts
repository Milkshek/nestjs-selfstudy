import { Injectable } from '@nestjs/common';
import {ArticlesService} from "../articles/articles.service.js";

@Injectable()
export class StatisticsService {
  constructor(private articlesService: ArticlesService) {}

  async countArticles(): Promise<number> {
    return this.articlesService.countAll();
  }
}
