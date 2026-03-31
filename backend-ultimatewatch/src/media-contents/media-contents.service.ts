import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MediaContent } from './entities/media-content.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';

@Injectable()
export class MediaContentsService {
  constructor(
    @InjectRepository(MediaContent)
    private readonly mediaContentRepository: Repository<MediaContent>,
  ) {}

  async findByTmdbId(tmdbId: number): Promise<MediaContent> {
    const mediaContent: MediaContent | null =
      await this.mediaContentRepository.findOne({ where: { tmdbId } });

    if (!mediaContent) {
      throw new ResourceNotFoundException(
        'Media Content',
        'TMDB_ID',
        String(tmdbId),
      );
    }

    return mediaContent;
  }
}
