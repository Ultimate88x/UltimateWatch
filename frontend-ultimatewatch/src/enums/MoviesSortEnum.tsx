export const MoviesSortEnum = {
  POPULARITY_DESC: 'popularity.desc',
  POPULARITY_ASC: 'popularity.asc',
  REVENUE_DESC: 'revenue.desc',
  REVENUE_ASC: 'revenue.asc',
  PRIMARY_RELEASE_DATE_DESC: 'primary_release_date.desc',
  PRIMARY_RELEASE_DATE_ASC: 'primary_release_date.asc',
} as const;

export type MoviesSortOption = typeof MoviesSortEnum[keyof typeof MoviesSortEnum];