import { Module } from '@nestjs/common';
import {ArticlesModule} from "../articles/articles.module.js";
import {StatisticsController} from "./statistics.controller.js";
import {StatisticsService} from "./statistics.service.js";


@Module({
  controllers: [StatisticsController],
  providers: [StatisticsService],
  imports: [ArticlesModule]
})
export class StatisticsModule {}
