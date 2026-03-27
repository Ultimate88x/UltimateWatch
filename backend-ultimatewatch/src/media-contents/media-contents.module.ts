import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaContent } from './entities/media.content.entity';
import { MediaContentsService } from './media-contents.service';

@Module({
  imports: [TypeOrmModule.forFeature([MediaContent])],
  providers: [MediaContentsService],
  exports: [MediaContentsService],
})
export class MediaContentsModule {}
