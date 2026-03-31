import { Injectable } from '@nestjs/common';
import { Season } from './entities/season.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SeasonService {
  constructor(
    @InjectRepository(Season)
    private readonly seasonRepository: Repository<Season>,
  ) {}

  async create(season: Season): Promise<Season> {
    return await this.seasonRepository.save(season);
  }
}
