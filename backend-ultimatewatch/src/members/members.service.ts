import { Injectable } from '@nestjs/common';
import { Member } from './entities/member.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
import { User } from 'src/users/entities/user.entity';
import { Event } from 'src/events/entities/event.entity';
import { MemberRole } from 'src/common/enums/member.role.enum';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
  ) {}

  create(user: User, event: Event): Member {
    return this.membersRepository.create({
      role: MemberRole.MEMBER,
      user,
      event,
    });
  }

  async save(member: Member): Promise<Member> {
    return await this.membersRepository.save(member);
  }

  async delete(id: number): Promise<void> {
    await this.membersRepository.delete(id);
  }

  async findByUserIdAndEventId(
    userId: number,
    eventId: number,
  ): Promise<Member | null> {
    const member: Member | null = await this.membersRepository.findOne({
      where: {
        user: { id: userId },
        event: { id: eventId },
      },
      relations: ['votes'],
    });

    return member;
  }

  async getByUserIdAndEventId(
    userId: number,
    eventId: number,
  ): Promise<Member> {
    const member: Member | null = await this.findByUserIdAndEventId(
      userId,
      eventId,
    );

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
