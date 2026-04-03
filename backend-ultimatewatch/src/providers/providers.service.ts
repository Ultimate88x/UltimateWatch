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
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';

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

  async findMediaProvidersByTmdbId(
    mediaTmdbId: number,
  ): Promise<MediaProvider[]> {
    const mediaProviders = await this.mediaProviderRepository.find({
      where: { mediaContent: { tmdbId: mediaTmdbId } },
      relations: ['provider'],
    });

    return mediaProviders;
  }

  async findOrCreate(
    mediaTmdbId: number,
    providerData: Provider,
  ): Promise<Provider> {
    await this.providerRepository.upsert(providerData, ['tmdbId']);
    const savedProvider = await this.findByTmdbId(providerData.tmdbId);

    const mediaContent =
      await this.mediaContentService.findByTmdbId(mediaTmdbId);

    if (!mediaContent) {
      throw new ResourceNotFoundException(
        'Media Content',
        'TMDB_ID',
        mediaTmdbId.toString(),
      );
    }

    if (!savedProvider) {
      throw new ResourceNotFoundException(
        'Provider',
        'TMDB_ID',
        providerData.tmdbId.toString(),
      );
    }

    await this.mediaProviderRepository.upsert(
      {
        mediaContent: mediaContent,
        provider: savedProvider,
        uniqueLastRetrieved: new Date(),
      },
      ['mediaContent', 'provider'],
    );

    return savedProvider;
  }

  async findProvidersOrGetFromTmdbAndFindOrCreate(
    mediaTmdbId: number,
    mediaType: MediaType,
  ): Promise<ProviderListItemDto[] | null> {
    const localProviders = await this.findMediaProvidersByTmdbId(mediaTmdbId);
    const isStale =
      localProviders.length > 0
        ? localProviders.some((mediaProvider: MediaProvider) =>
            isDataStale(mediaProvider.uniqueLastRetrieved),
          )
        : true;

    if (!isStale) {
      return localProviders.map((mp) =>
        this.createProviderListItem(mp.provider),
      );
    }
    const providerInfo: TmdbProviderInfoDto | undefined =
      await this.tmdbapiService.getProvidersForMedia(mediaTmdbId, mediaType);

    if (!providerInfo) return null;

    const providers =
      TmdbApiMapper.tmdbProviderInfoDtoToProviderList(providerInfo);

    await this.syncProviders(mediaTmdbId, providers);

    const finalProviders = await Promise.all(
      providers.map((p) => this.findOrCreate(mediaTmdbId, p)),
    );

    return finalProviders.map((p) => this.createProviderListItem(p));
  }

  async syncProviders(mediaTmdbId: number, providersFromTmdb: Provider[]) {
    const currentMediaProviders =
      await this.findMediaProvidersByTmdbId(mediaTmdbId);

    const apiTmdbIds = providersFromTmdb.map((p) => p.tmdbId);

    const providersToRemove = currentMediaProviders.filter(
      (mp) => !apiTmdbIds.includes(mp.provider.tmdbId),
    );

    if (providersToRemove.length > 0) {
      const idsToDelete = providersToRemove.map((mp) => mp.id);

      await this.mediaProviderRepository.delete(idsToDelete);
    }
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

  async findProviderUrlForMediaAndProvider(
    mediaTmdbId: number,
    providerTmdbId: number,
  ): Promise<string | null | undefined> {
    const mediaProviders = await this.mediaProviderRepository.find({
      where: { mediaContent: { tmdbId: mediaTmdbId } },
      relations: ['mediaContent', 'provider'],
    });

    if (mediaProviders.length === 0) return null;

    const isStale = mediaProviders.some((mp: MediaProvider) =>
      isDataStale(mp.lastLinkUpdate),
    );
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
        updatedMediaProvider.lastLinkUpdate = new Date();
        return updatedMediaProvider;
      });

      await this.mediaProviderRepository.save(updatedProviders);
    }

    const mediaProvider = await this.mediaProviderRepository
      .createQueryBuilder('mp')
      .select('mp.link', 'link')
      .innerJoin('mp.mediaContent', 'mc')
      .innerJoin('mp.provider', 'p')
      .where('mc.tmdbId = :mediaTmdbId', { mediaTmdbId })
      .andWhere('p.tmdbId = :providerTmdbId', { providerTmdbId })
      .getRawOne<{ link: string }>();

    return mediaProvider?.link;
  }

  createProviderListItem(provider: Provider): ProviderListItemDto {
    return new ProviderListItemDto({
      tmdbId: provider.tmdbId,
      name: provider.name,
      logoPath: provider.logoPath,
    });
  }
}
