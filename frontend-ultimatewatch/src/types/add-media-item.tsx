import type { Media } from "./media-item";

interface AddMedia extends Media {
  type: string;
  parentId?: number;
}

export type {AddMedia}