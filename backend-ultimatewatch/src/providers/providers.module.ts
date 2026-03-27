import { Module } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { Provider } from './entities/provider.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaProvider } from './entities/media.provider.entity';
import { ProvidersController } from './providers.controller';
import { TmdbApiModule } from 'src/common/tmdbapi/tmdbapi.module';
import { MediaContentsModule } from 'src/media-contents/media-contents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Provider]),
    TypeOrmModule.forFeature([MediaProvider]),
    TmdbApiModule,
    MediaContentsModule,
  ],
  providers: [ProvidersService],
  controllers: [ProvidersController],
})
export class ProvidersModule {}
