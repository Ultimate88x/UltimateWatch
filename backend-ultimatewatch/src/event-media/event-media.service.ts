import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventMedia } from './entities/event-media.entity';
import { In, Not, Repository } from 'typeorm';
import { Event } from 'src/events/entities/event.entity';
import { Media } from 'src/media/entities/media.entity';
import { EventMediaStatus } from 'src/common/enums/event.media.status.enum';
import { UpdateSortOrderDto } from './dto/update-sort-order-dto';
import { MembersService } from 'src/members/members.service';
import { Member } from 'src/members/entities/member.entity';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';

@Injectable()
export class EventMediaService {
  constructor(
    @InjectRepository(EventMedia)
    private eventMediaRepository: Repository<EventMedia>,
    private membersService: MembersService,
  ) {}

  async getByIds(ids: number[]): Promise<EventMedia[]> {
    return await this.eventMediaRepository.find({
      where: { id: In(ids) },
      relations: ['event'],
    });
  }

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

  async updateSortOrder(
    userId: number,
    updateSortOrderDto: UpdateSortOrderDto,
  ): Promise<void> {
    const { items } = updateSortOrderDto;
    if (items.length === 0) return;

    const mediaIds = items.map((item) => item.id);
    const eventMediaList = await this.getByIds(mediaIds);

    if (eventMediaList.length !== items.length) {
      throw new ResourceNotFoundException(
        'Event Media List',
        'ID_LIST',
        mediaIds.join(', '),
      );
    }

    const eventIds = [...new Set(eventMediaList.map((em) => em.event.id))];
    for (const eventId of eventIds) {
      const ownerMember: Member =
        await this.membersService.getOwnerFromEvent(eventId);

      if (!ownerMember || userId !== ownerMember.user.id) {
        throw new ForbiddenException(`Sin permiso para el evento ${eventId}`);
      }
    }

    const newItemInCurrent = items.find(
      (i) => i.status === EventMediaStatus.CURRENT,
    );

    if (newItemInCurrent) {
      const itemInfo = eventMediaList.find(
        (em) => em.id === newItemInCurrent.id,
      );

      const previousCurrent = await this.eventMediaRepository.findOne({
        where: {
          event: { id: itemInfo?.event.id },
          status: EventMediaStatus.CURRENT,
          id: Not(newItemInCurrent.id),
        },
      });

      if (previousCurrent) {
        await this.eventMediaRepository.update(previousCurrent.id, {
          status: EventMediaStatus.WATCHED,
          order: 0,
        });
      }
    }

    const updates = items.map((item) =>
      this.eventMediaRepository.update(item.id, {
        order: item.order,
        status: item.status,
      }),
    );

    await Promise.all(updates);
  }
}
