import { Injectable } from '@nestjs/common';
import { Member } from './entities/member.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
    private readonly usersService: UsersService,
  ) {}
}
