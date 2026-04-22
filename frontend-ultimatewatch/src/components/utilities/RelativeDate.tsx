import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { formatDate } from './FormatDate';
import { enUS } from 'date-fns/locale';

export const getRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const daysDiff = differenceInDays(now, date);

  if (daysDiff > 7) {
    return formatDate(dateString);
  }

  return formatDistanceToNow(date.toLocaleString(), { 
    addSuffix: true, 
    locale: enUS 
  });
};