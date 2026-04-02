export const SortEnum = {
  POPULARITY_DESC: 'popularity.desc',
  POPULARITY_ASC: 'popularity.asc',
  REVENUE_DESC: 'revenue.desc',
  REVENUE_ASC: 'revenue.asc',
  PRIMARY_RELEASE_DATE_DESC: 'primary_release_date.desc',
  PRIMARY_RELEASE_DATE_ASC: 'primary_release_date.asc',
  FIRST_AIR_DATE_DESC: 'first_air_date.desc',
  FIRST_AIR_DATE_ASC: 'first_air_date.asc',
} as const;

export type SortOption = typeof SortEnum[keyof typeof SortEnum];