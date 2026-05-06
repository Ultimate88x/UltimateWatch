import { forwardRef, Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';
import { FriendRequest } from './entities/friend-request.entity';
import { UsersModule } from 'src/users/users.module';
import { EventInviteRequest } from './entities/event-invite-request.entity';
import { EventAccessRequest } from './entities/event-access-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Request,
      FriendRequest,
      EventInviteRequest,
      EventAccessRequest,
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
