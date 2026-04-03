import { Test, TestingModule } from '@nestjs/testing';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';
import { MediaProviderQueryDto } from './dto/media-provider-query-dto';

describe('ProvidersController', () => {
  let controller: ProvidersController;

  const mockProvidersService = {
    findProviderUrlForMediaAndProvider: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProvidersController],
      providers: [
        {
          provide: ProvidersService,
          useValue: mockProvidersService,
        },
      ],
    }).compile();

    controller = module.get<ProvidersController>(ProvidersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProviderLinkByMediaTmdbIdAndProviderTmdbId', () => {
    it('should return the provider link from the service', async () => {
      const query: MediaProviderQueryDto = {
        mediaTmdbId: 123,
        providerTmdbId: 8,
      };
      const mockLink = 'https://www.netflix.com/title/123';

      mockProvidersService.findProviderUrlForMediaAndProvider.mockResolvedValue(
        mockLink,
      );

      const result =
        await controller.getProviderLinkByMediaTmdbIdAndProviderTmdbId(query);

      expect(
        mockProvidersService.findProviderUrlForMediaAndProvider,
      ).toHaveBeenCalledWith(query.mediaTmdbId, query.providerTmdbId);
      expect(result).toBe(mockLink);
    });

    it('should return null or undefined if the service does not find a link', async () => {
      const query: MediaProviderQueryDto = {
        mediaTmdbId: 999,
        providerTmdbId: 1,
      };

      mockProvidersService.findProviderUrlForMediaAndProvider.mockResolvedValue(
        null,
      );

      const result =
        await controller.getProviderLinkByMediaTmdbIdAndProviderTmdbId(query);

      expect(result).toBeNull();
    });

    it('should propagate errors from the service', async () => {
      const query: MediaProviderQueryDto = {
        mediaTmdbId: 123,
        providerTmdbId: 8,
      };

      mockProvidersService.findProviderUrlForMediaAndProvider.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(
        controller.getProviderLinkByMediaTmdbIdAndProviderTmdbId(query),
      ).rejects.toThrow('Service error');
    });
  });
});
