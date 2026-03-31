export class ProductionCompanyDto {
  name: string;
  logoPath: string;

  constructor(init?: Partial<ProductionCompanyDto>) {
    Object.assign(this, init);
  }
}
