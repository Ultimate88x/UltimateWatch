import { ProductionCompanyDto } from 'src/production-companies/dto/production-company-dto';

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

  constructor(init?: Partial<SeriesDetailDto>) {
    Object.assign(this, init);
  }
}
