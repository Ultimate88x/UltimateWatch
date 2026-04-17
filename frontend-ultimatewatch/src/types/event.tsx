import type { MediaEvent } from "./media-event";

type Event = {
  id: number;
  name: string;
  description?: string | null;
  eventDate: string;
  type: string;
  status: string;
  media: MediaEvent[] | null;
  maxMembers: number;
}

export type {Event}