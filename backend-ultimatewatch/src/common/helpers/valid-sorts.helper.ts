import { MediaType } from '../enums/media.type.enum';
import { SortEnum } from '../enums/sort.enum';

const VALID_SORTS_BY_TYPE: Record<MediaType, SortEnum[]> = {
  [MediaType.MOVIE]: [
    SortEnum.POPULARITY_DESC,
    SortEnum.POPULARITY_ASC,
    SortEnum.REVENUE_DESC,
    SortEnum.REVENUE_ASC,
    SortEnum.PRIMARY_RELEASE_DATE_DESC,
    SortEnum.PRIMARY_RELEASE_DATE_ASC,
  ],
  [MediaType.SERIES]: [
    SortEnum.POPULARITY_DESC,
    SortEnum.POPULARITY_ASC,
    SortEnum.FIRST_AIR_DATE_DESC,
    SortEnum.FIRST_AIR_DATE_ASC,
  ],
};

export const getSafeSortBy = (type: MediaType, sortValue?: string): string => {
  const defaultSort = SortEnum.POPULARITY_DESC;

  if (!sortValue || !VALID_SORTS_BY_TYPE[type]) {
    return defaultSort;
  }

  const isValid = VALID_SORTS_BY_TYPE[type].includes(sortValue as SortEnum);

  return isValid ? sortValue : defaultSort;
};
