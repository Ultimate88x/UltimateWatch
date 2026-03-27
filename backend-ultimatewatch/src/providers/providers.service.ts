import { Injectable } from '@nestjs/common';
import { Provider } from './entities/provider.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaProvider } from './entities/media.provider.entity';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { TmdbProviderInfoDto } from 'src/common/tmdbapi/dto/tmdb-provider-response-dto';
import { MediaType } from 'src/common/tmdbapi/enums/media.type.enum';
import { TmdbApiMapper } from 'src/common/tmdbapi/mapper/tmdbapi-mapper';
import { MediaContentsService } from 'src/media-contents/media-contents.service';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    @InjectRepository(MediaProvider)
    private readonly mediaProviderRepository: Repository<MediaProvider>,
    private readonly tmdbapiService: TmdbApiService,
    private readonly mediaContentService: MediaContentsService,
  ) {}

  async createProvider(provider: Provider): Promise<Provider> {
    return await this.providerRepository.save(provider);
  }

  async createMediaProvider(
    mediaProvider: MediaProvider,
  ): Promise<MediaProvider> {
    return await this.mediaProviderRepository.save(mediaProvider);
  }

  async findByTmdbId(tmdbId: number): Promise<Provider | null> {
    const provider = await this.providerRepository.findOne({
      where: { tmdbId },
    });

    return provider;
  }

  async findProvidersByTmdbId(mediaTmdbId: number): Promise<Provider[]> {
    const providers = await this.mediaProviderRepository
      .createQueryBuilder('mp')
      .innerJoinAndSelect('mp.provider', 'p')
      .innerJoin('mp.mediaContent', 'm')
      .where('m.tmdbId = :mediaTmdbId', { mediaTmdbId })
      .getMany()
      .then((mediaProviders) => mediaProviders.map((mp) => mp.provider));

    return providers;
  }

  async findOrCreate(
    providerTmdbId: number,
    mediaTmdbId: number,
    provider: Provider,
  ): Promise<Provider> {
    let savedProvider = await this.findByTmdbId(providerTmdbId);

    if (!savedProvider) {
      savedProvider = await this.createProvider(provider);
    }

    const mediaContent =
      await this.mediaContentService.findByTmdbId(mediaTmdbId);

    const mediaProvider = new MediaProvider();
    mediaProvider.mediaContent = mediaContent;
    mediaProvider.provider = savedProvider;

    await this.createMediaProvider(mediaProvider);

    return savedProvider;
  }

  async findProvidersOrGetFromTmdbAndFindOrCreate(
    mediaTmdbId: number,
    mediaType: MediaType,
  ): Promise<Provider[] | null> {
    let providers: Provider[] = await this.findProvidersByTmdbId(mediaTmdbId);

    if (providers.length > 0) {
      return providers;
    }

    let providerInfo: TmdbProviderInfoDto | undefined;

    switch (mediaType) {
      case MediaType.MOVIE:
        providerInfo =
          await this.tmdbapiService.getProvidersForMovie(mediaTmdbId);
        break;

      default:
        providerInfo =
          await this.tmdbapiService.getProvidersForMovie(mediaTmdbId);
        break;
    }

    if (!providerInfo) {
      return null;
    }

    providers = TmdbApiMapper.tmdbProviderInfoDtoToProviderList(providerInfo);

    return await Promise.all(
      providers.map((provider: Provider) =>
        this.findOrCreate(provider.tmdbId, mediaTmdbId, provider),
      ),
    );
  }
}
