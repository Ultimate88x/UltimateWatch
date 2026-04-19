export const EventTypeEnum = {
  STANDARD: 'standard',
  VOTING: 'voting',
} as const;

export type EventType = typeof EventTypeEnum[keyof typeof EventTypeEnum];