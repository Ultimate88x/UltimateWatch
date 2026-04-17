type EventItem = {
  id: string;
  name: string;
  eventDate: string;
  type: string;
  status: string;
  creatorName: string;
  creatorImagePath: string;
  mediaTitles?: string | null;
  mainImagePath?: string | null;
  currentMembers: number;
  maxMembers: number;
}

export type {EventItem}