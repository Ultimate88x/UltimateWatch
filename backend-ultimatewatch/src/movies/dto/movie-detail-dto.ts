import { ProductionCompanyDto } from 'src/production-companies/dto/production-company-dto';

export class MovieDetailDto {
  tmdbId: number;
  title: string;
  overview: string;
  imagePath: string;
  status: string;
  genres: string[];
  productionCompanies: ProductionCompanyDto[];
  budget: number;
  runtime: number;
  revenue: number;
  releaseDate: string | null;

  constructor(init?: Partial<MovieDetailDto>) {
    Object.assign(this, init);
  }
}
