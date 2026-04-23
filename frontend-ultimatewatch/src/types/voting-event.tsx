import type { Event } from '../types/event';

interface VotingEvent {
  maxMedia?: number;
  maxVotesPerMember?: number;
  votingEndDate?: string;
}

export type EnhancedEvent = Event & VotingEvent;