import { Test, TestingModule } from '@nestjs/testing';
import { ProductionCompaniesService } from './production-companies.service';

describe('ProductionCompaniesService', () => {
  let service: ProductionCompaniesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductionCompaniesService],
    }).compile();

    service = module.get<ProductionCompaniesService>(ProductionCompaniesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
