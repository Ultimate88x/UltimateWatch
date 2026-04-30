export const EventVisibilityEnum = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  REQUEST_ONLY: 'request_only',
  FRIENDS_ONLY: 'friends_only',
} as const;

export type EventVisibility = typeof EventVisibilityEnum[keyof typeof EventVisibilityEnum];