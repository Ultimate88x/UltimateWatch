import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { Comment } from './entities/comment.entity';
import { MembersModule } from 'src/members/members.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment]), MembersModule],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
