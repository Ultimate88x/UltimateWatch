import { Test, TestingModule } from '@nestjs/testing';
import { MediaContentsService } from './media-contents.service';
import { MediaContent } from './entities/media-content.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('MediaContentsService', () => {
  let service: MediaContentsService;

  const createMockRepository = (): MockRepository<MediaContent> => ({});

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaContentsService,
        {
          provide: getRepositoryToken(MediaContent),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<MediaContentsService>(MediaContentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
