import { Module } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { Provider } from './entities/provider.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaProvider } from './entities/media.provider.entity';
import { ProvidersController } from './providers.controller';
import { TmdbApiModule } from 'src/common/tmdbapi/tmdbapi.module';
import { MediaModule } from 'src/media/media.module';
import { WatchmodeModule } from 'src/common/watchmode/watchmode.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Provider, MediaProvider]),
    TmdbApiModule,
    WatchmodeModule,
    MediaModule,
  ],
  providers: [ProvidersService],
  controllers: [ProvidersController],
  exports: [ProvidersService],
})
export class ProvidersModule {}
