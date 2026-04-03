export class ProviderListItemDto {
  tmdbId: number;
  name: string;
  logoPath: string;

  constructor(init?: Partial<ProviderListItemDto>) {
    Object.assign(this, init);
  }
}
