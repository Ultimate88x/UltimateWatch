export const EventTypeEnum = {
  STANDARD: 'standard_event',
  VOTING: 'voting_event',
} as const;

export type EventType = typeof EventTypeEnum[keyof typeof EventTypeEnum];