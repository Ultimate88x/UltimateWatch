import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment-dto';
import { Member } from 'src/members/entities/member.entity';
import { MembersService } from 'src/members/members.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly membersService: MembersService,
  ) {}

  async save(comment: Comment): Promise<Comment> {
    return await this.commentRepository.save(comment);
  }

  async create(commentDto: CreateCommentDto): Promise<Comment> {
    const member: Member = await this.membersService.getByUserIdAndEventId(
      commentDto.userId,
      commentDto.eventId,
    );

    const comment = this.commentRepository.create({
      message: commentDto.message,
      member,
    });
    return await this.save(comment);
  }
}
