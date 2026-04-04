import type { Media } from "./media-item";

type Collection = {
  id: number;
  title: string;
  mediaItems: Media[];
}

export type {Collection}