import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Media } from './entities/media.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
  ) {}

  async findById(id: number): Promise<Media> {
    const media: Media | null = await this.mediaRepository.findOne({
      where: { id },
    });

    if (!media) {
      throw new ResourceNotFoundException('Media', 'ID', String(id));
    }

    return media;
  }

  async findByTmdbId(tmdbId: number): Promise<Media> {
    const media: Media | null = await this.mediaRepository.findOne({
      where: { tmdbId },
    });

    if (!media) {
      throw new ResourceNotFoundException('Media', 'TMDB_ID', String(tmdbId));
    }

    return media;
  }
}
