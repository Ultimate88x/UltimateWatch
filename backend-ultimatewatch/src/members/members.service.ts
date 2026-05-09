import { Injectable } from '@nestjs/common';
import { Member } from './entities/member.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
import { User } from 'src/users/entities/user.entity';
import { Event } from 'src/events/entities/event.entity';
import { MemberRole } from 'src/common/enums/member.role.enum';
import { MemberDetailDto } from './dto/member-detail-dto';
import { MemberListResponseDto } from './dto/member-list-response-dto';

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
      relations: ['votes', 'votes.media', 'user'],
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

  async findOwnerFromEvent(eventId: number): Promise<Member | null> {
    const eventOwner: Member | null = await this.membersRepository.findOne({
      where: { event: { id: eventId }, role: MemberRole.OWNER },
      relations: ['user'],
    });

    return eventOwner;
  }

  async getOwnerFromEvent(eventId: number): Promise<Member> {
    const eventOwner: Member | null = await this.findOwnerFromEvent(eventId);

    if (!eventOwner) {
      throw new ResourceNotFoundException('Owner', 'EVENT_ID', `${eventId}`);
    }

    return eventOwner;
  }

  async retrieveByUserIdAndEventId(
    userId: number,
    eventId: number,
  ): Promise<MemberDetailDto | null> {
    const member: Member | null = await this.findByUserIdAndEventId(
      userId,
      eventId,
    );

    return member
      ? new MemberDetailDto({
          name: member.user.username || '',
          imagePath: member.user.imagePath || '',
          role: member.role || MemberRole.MEMBER,
          isCurrentUser: true,
        })
      : null;
  }

  async getFromEvent(
    eventId: number,
    page: number,
    limit: number,
    userId: number,
  ): Promise<MemberListResponseDto> {
    const skip = (page - 1) * limit;

    const query = this.membersRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.user', 'user')
      .where('member.eventId = :eventId', { eventId })
      .addSelect(
        `(CASE 
        WHEN member.role = :owner THEN 1 
        WHEN member.role = :moderator THEN 2 
        ELSE 3 
      END)`,
        'role_priority',
      )
      .orderBy('role_priority', 'ASC')
      .addOrderBy('member.createdAt', 'ASC')
      .setParameters({
        owner: MemberRole.OWNER,
        moderator: MemberRole.MODERATOR,
      })
      .skip(skip)
      .take(limit);

    const [data, total] = await query.getManyAndCount();

    return new MemberListResponseDto({
      data: data.map((member: Member) =>
        this.createMemberDetailDto(member, userId),
      ),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    });
  }

  async countFromEvent(eventId: number): Promise<number> {
    const currentMembers: number = await this.membersRepository.count({
      where: { event: { id: eventId } },
    });

    return currentMembers;
  }

  private createMemberDetailDto(
    member: Member,
    userId: number,
  ): MemberDetailDto {
    return new MemberDetailDto({
      name: member.user.username,
      imagePath: member.user.imagePath,
      role: member.role,
      isCurrentUser: member.user.id === userId,
    });
  }
}
