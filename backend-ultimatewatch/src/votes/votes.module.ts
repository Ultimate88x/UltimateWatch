import { Module } from '@nestjs/common';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vote } from './entities/vote.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vote])],
  controllers: [VotesController],
  providers: [VotesService],
})
export class VotesModule {}
