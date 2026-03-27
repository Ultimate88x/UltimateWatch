import { Module } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { Provider } from './entities/provider.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaProvider } from './entities/media.provider.entity';
import { ProvidersController } from './providers.controller';
import { TmdbApiModule } from 'src/common/tmdbapi/tmdbapi.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Provider]),
    TypeOrmModule.forFeature([MediaProvider]),
    TmdbApiModule,
  ],
  providers: [ProvidersService],
  controllers: [ProvidersController],
})
export class ProvidersModule {}
