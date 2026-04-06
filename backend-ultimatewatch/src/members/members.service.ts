import { Injectable } from '@nestjs/common';
import { Member } from './entities/member.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { EventsService } from 'src/events/events.service';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
    private readonly usersService: UsersService,
    private readonly eventsService: EventsService,
  ) {}

  async findByUserIdAndEventId(
    userId: number,
    eventId: number,
  ): Promise<Member> {
    await this.usersService.findById(userId);
    await this.eventsService.findBydId(eventId);

    const member: Member | null = await this.membersRepository.findOne({
      where: {
        user: { id: userId },
        event: { id: eventId },
      },
      relations: ['votes'],
    });

    if (!member) {
      throw new ResourceNotFoundException(
        'Member',
        '{ USER_ID, EVENT_ID }',
        `{ ${userId}, ${eventId} }`,
      );
    }

    return member;
  }
}
