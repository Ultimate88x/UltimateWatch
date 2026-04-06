import { Injectable } from '@nestjs/common';
import { Event } from './entities/event.entity';
import { Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { Member } from 'src/members/entities/member.entity';
import { MediaService } from 'src/media/media.service';
import { Media } from 'src/media/entities/media.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    private readonly usersService: UsersService,
    private readonly mediaService: MediaService,
  ) {}

  async save(event: Event): Promise<Event> {
    return await this.eventsRepository.save(event);
  }

  async create(createEventDto: CreateEventDto, userId: number): Promise<void> {
    const user: User = await this.usersService.findById(userId);

    const creator: Member = new Member();
    creator.user = user;

    const mediaList: Media[] = await Promise.all(
      createEventDto.mediaIds.map(async (id: number) =>
        this.mediaService.findById(id),
      ),
    );

    const event: Event = this.eventsRepository.create({
      ...createEventDto,
      members: [creator],
      media: mediaList,
      timer: 0,
      visibility: '',
    });
    await this.save(event);
  }
}
