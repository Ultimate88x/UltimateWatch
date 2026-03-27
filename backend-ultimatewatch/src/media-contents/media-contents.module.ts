import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaContent } from './entities/media.content.entity';

@Module({ imports: [TypeOrmModule.forFeature([MediaContent])] })
export class MediaContentsModule {}
