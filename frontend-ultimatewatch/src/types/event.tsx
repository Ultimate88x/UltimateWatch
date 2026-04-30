interface Event {
  id: number;
  name: string;
  description?: string | null;
  eventDate: string;
  type: string;
  visibility: string;
  status: string;
  maxMembers: number;
}

export type {Event}