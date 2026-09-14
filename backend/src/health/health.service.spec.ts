import { HealthService } from './health.service.js';

describe('HealthService', () => {
  it('reports that the API is available', () => {
    const service = new HealthService();

    expect(service.getHealth()).toEqual({ status: 'ok' });
  });
});
