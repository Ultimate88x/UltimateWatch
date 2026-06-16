import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { formatDate } from './FormatDate';
import { enUS } from 'date-fns/locale';

export const getRelativeDate = (dateString: string): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  const now = new Date();
  const daysDiff = differenceInDays(now, date);

  if (daysDiff > 7) {
    return formatDate(dateString);
  }

  return formatDistanceToNow(date, { 
    addSuffix: true, 
    locale: enUS 
  });
};