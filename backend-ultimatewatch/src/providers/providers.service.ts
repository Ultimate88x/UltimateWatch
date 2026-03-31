import { Injectable } from '@nestjs/common';
import { Provider } from './entities/provider.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaProvider } from './entities/media.provider.entity';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { TmdbProviderInfoDto } from 'src/common/tmdbapi/dto/tmdb-provider-response-dto';
import { TmdbApiMapper } from 'src/common/tmdbapi/mapper/tmdbapi-mapper';
import { MediaContentsService } from 'src/media-contents/media-contents.service';
import { WatchmodeService } from 'src/common/watchmode/watchmode.service';
import { MediaType } from 'src/common/enums/media.type.enum';
import { WatchmodeProviderDto } from 'src/common/watchmode/dto/watchmode-provider-dto';
import { isDataStale } from 'src/common/helpers/data-stale.helper';
import { ProviderListItemDto } from './dto/provider-list-item-dto';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    @InjectRepository(MediaProvider)
    private readonly mediaProviderRepository: Repository<MediaProvider>,
    private readonly tmdbapiService: TmdbApiService,
    private readonly watchmodeService: WatchmodeService,
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
    const mediaProviders = await this.mediaProviderRepository.find({
      where: { mediaContent: { tmdbId: mediaTmdbId } },
      relations: ['provider'],
    });

    return mediaProviders.map((mp) => mp.provider);
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
  ): Promise<ProviderListItemDto[] | null> {
    const localProviders = await this.findProvidersByTmdbId(mediaTmdbId);
    const isStale =
      localProviders.length > 0
        ? isDataStale(localProviders[0].updatedAt)
        : true;

    if (!isStale) {
      return localProviders.map((p) => this.createProviderListItem(p));
    }

    const providerInfo: TmdbProviderInfoDto | undefined =
      await this.tmdbapiService.getProvidersForMedia(mediaTmdbId, mediaType);

    if (!providerInfo) return null;

    const providers =
      TmdbApiMapper.tmdbProviderInfoDtoToProviderList(providerInfo);
    const finalProviders = await Promise.all(
      providers.map((p) => this.findOrCreate(p.tmdbId, mediaTmdbId, p)),
    );

    return finalProviders.map((p) => this.createProviderListItem(p));
  }

  private normalize(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[+\s]/g, '')
      .replace(/plus/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private getProviderAlias(name: string): string {
    const normalized = name.toLowerCase().trim();

    const aliases: Record<string, string> = {
      'google play movies': 'google',
      'google play': 'google',
      'google tv': 'google',
      'apple tv plus': 'apple',
      'apple tv+': 'apple',
      'amazon prime video': 'amazon',
      'prime video': 'amazon',
      'hbo max': 'max',
    };

    return aliases[normalized] || normalized;
  }

  assignUrlToMediaProvider(
    mediaProvider: MediaProvider,
    watchmodeProviders: WatchmodeProviderDto[],
  ) {
    const ourName = this.normalize(
      this.getProviderAlias(mediaProvider.provider.name),
    );

    const matchedWatchmode = watchmodeProviders.find((wm) => {
      const wmName = this.normalize(this.getProviderAlias(wm.name));

      return wmName.includes(ourName) || ourName.includes(wmName);
    });

    if (matchedWatchmode) {
      mediaProvider.link = matchedWatchmode.web_url;
    } else {
      mediaProvider.link = null;
    }

    return mediaProvider;
  }

  async findProviderUrlsForMedia(
    mediaTmdbId: number,
  ): Promise<MediaProvider[]> {
    const mediaProviders = await this.mediaProviderRepository.find({
      where: { mediaContent: { tmdbId: mediaTmdbId } },
      relations: ['mediaContent', 'provider'],
    });

    if (mediaProviders.length === 0) return [];

    const isStale = isDataStale(mediaProviders[0].updatedAt);
    const hasAnyLink = mediaProviders.some(
      (mediaProvider) => !!mediaProvider.link,
    );

    if (isStale || !hasAnyLink) {
      const watchmodeProviders =
        await this.watchmodeService.getProvidersForMediaFromWatchmode(
          mediaTmdbId,
          mediaProviders[0].mediaContent.type,
        );

      const updatedProviders = mediaProviders.map((mediaProvider) => {
        const updatedMediaProvider = this.assignUrlToMediaProvider(
          mediaProvider,
          watchmodeProviders,
        );

        updatedMediaProvider.updatedAt = new Date();
        return updatedMediaProvider;
      });

      await this.mediaProviderRepository.save(updatedProviders);

      return updatedProviders;
    }

    return mediaProviders;
  }

  createProviderListItem(provider: Provider): ProviderListItemDto {
    return new ProviderListItemDto({
      name: provider.name,
      logoPath: provider.logoPath,
    });
  }
}
