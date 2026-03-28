import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SeedModule } from './common/seed/seed.module';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module';
import { EmailModule } from './common/email/email.module';
import { SeriesModule } from './series/series.module';
import { TmdbApiModule } from './common/tmdbapi/tmdbapi.module';
import { MoviesModule } from './movies/movies.module';
import { GenresModule } from './genres/genres.module';
import { ProductionCompaniesModule } from './production-companies/production-companies.module';
import { ProvidersModule } from './providers/providers.module';
import { MediaContentsModule } from './media-contents/media-contents.module';
import { WatchmodeModule } from './common/watchmode/watchmode.module';
import { ComplianceModule } from './compliance/compliance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT', 5432),
        username: 'ultimate_watch_user',
        password: 'ultimate_watch_password',
        database: 'ultimate_watch_db',
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    UsersModule,
    AuthModule,
    SeedModule,
    CloudinaryModule,
    EmailModule,
    SeriesModule,
    TmdbApiModule,
    MoviesModule,
    GenresModule,
    ProductionCompaniesModule,
    ProvidersModule,
    MediaContentsModule,
    WatchmodeModule,
    ComplianceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
