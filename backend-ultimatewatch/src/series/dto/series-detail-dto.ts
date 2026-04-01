import { ProductionCompanyDto } from 'src/production-companies/dto/production-company-dto';
import { SeasonListDto } from 'src/season/dto/season-list-dto';

export class SeriesDetailDto {
  tmdbId: number;
  title: string;
  overview: string;
  imagePath: string;
  status: string;
  genres: string[];
  productionCompanies: ProductionCompanyDto[];
  releaseDate: string | null;
  lastAirDate: string | null;
  seasonsNumber: number;
  seasonsInfo: SeasonListDto[];

  constructor(init?: Partial<SeriesDetailDto>) {
    Object.assign(this, init);
  }
}
