export class ProviderListItemDto {
  name: string;
  logoPath: string;

  constructor(init?: Partial<ProviderListItemDto>) {
    Object.assign(this, init);
  }
}
