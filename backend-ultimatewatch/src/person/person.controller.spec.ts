import { Test, TestingModule } from '@nestjs/testing';
import { PersonController } from './person.controller';
import { PersonService } from './person.service';

describe('PersonController', () => {
  let controller: PersonController;

  const mockPersonService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonController],
      providers: [
        {
          provide: PersonService,
          useValue: mockPersonService,
        },
      ],
    }).compile();

    controller = module.get<PersonController>(PersonController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
