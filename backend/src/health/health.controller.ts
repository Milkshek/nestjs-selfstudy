import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service.js';
import type { HealthResponse } from './health.service.js';
import { ApiTags } from '@nestjs/swagger';

@Controller('health')
@ApiTags('Health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): HealthResponse {
    return this.healthService.getHealth();
  }
}
