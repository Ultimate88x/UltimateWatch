import { format, parseISO } from "date-fns";
import type { EventItem } from "../../types/event-item";

export const getGoogleCalendarLink = (event: EventItem) => {
  const startTime = parseISO(event.eventDate);
  const endTime = startTime; 
  
  const fmt = (date: Date) => format(date, "yyyyMMdd'T'HHmmss");

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `ULTIMATEWATCH: ${event.name}`,
    details: `Event: ${event.name}\nHost: ${event.creatorName}\nMedia: ${event.mediaTitles || 'TBD'}`,
    dates: `${fmt(startTime)}/${fmt(endTime)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};