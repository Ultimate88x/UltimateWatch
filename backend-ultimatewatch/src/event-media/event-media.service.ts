import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventMedia } from './entities/event-media.entity';
import { Repository } from 'typeorm';
import { Event } from 'src/events/entities/event.entity';
import { Media } from 'src/media/entities/media.entity';
import { EventMediaStatus } from 'src/common/enums/event.media.status.enum';

@Injectable()
export class EventMediaService {
  constructor(
    @InjectRepository(EventMedia)
    private eventMediaRepository: Repository<EventMedia>,
  ) {}

  async save(eventMedia: EventMedia): Promise<EventMedia> {
    return await this.eventMediaRepository.save(eventMedia);
  }

  async create(event: Event, media: Media) {
    const eventMedia: EventMedia = this.eventMediaRepository.create({
      event: event,
      media: media,
      order: event.media.length,
      status: EventMediaStatus.PENDING,
    });

    return await this.save(eventMedia);
  }

  async saveMany(eventMediaList: EventMedia[]): Promise<EventMedia[]> {
    return await this.eventMediaRepository.save(eventMediaList);
  }

  async createMany(event: Event, mediaList: Media[]) {
    const entries: EventMedia[] = mediaList.map((media, index) => {
      return this.eventMediaRepository.create({
        event: event,
        media: media,
        order: index,
        status: EventMediaStatus.PENDING,
      });
    });

    return await this.saveMany(entries);
  }
}
