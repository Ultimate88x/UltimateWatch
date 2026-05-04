import type { Request } from "./request";

interface EventInvitationRequest extends Request {
  eventId: number;
  eventName: string;
};

export type {EventInvitationRequest}