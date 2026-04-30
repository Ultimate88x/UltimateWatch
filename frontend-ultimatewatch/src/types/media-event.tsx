import type { SubMediaEvent } from "./sub-media-event";

type MediaEvent = {
  id: number;
  title: string;
  imagePath: string;
  type: string;
  subMediaEvent?: SubMediaEvent[] | null | undefined;
  count?: number | null | undefined;
  isVotable?: boolean;
}

export type {MediaEvent}