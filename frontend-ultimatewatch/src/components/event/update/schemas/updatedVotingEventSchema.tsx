import { z } from "zod";
import { EventVisibilityEnum } from "../../../../enums/EventVisibility";

const votingBase = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters long"),
  description: z.string().optional().nullable(),
  visibility: z.nativeEnum(EventVisibilityEnum, {
    error: () => ({ message: "Please select a valid visibility option" }),
  }),
  eventDate: z.preprocess((arg) => (typeof arg === "string" || arg instanceof Date ? new Date(arg) : arg), z.date()),
  maxMembers: z.coerce.number().int().min(2, "Minimum 2 members").max(50, "Maximum 50 members"),
  maxMedia: z.coerce.number().int().min(1, "At least one media must end up selected").max(20, "An event must have less or equal to 20 different media"),
  votingEndDate: z.preprocess((arg) => (typeof arg === "string" || arg instanceof Date ? new Date(arg) : arg), z.date()),
});

export const updateVotingEventSchema = votingBase.partial().refine((data) => {
  if (data.votingEndDate && data.eventDate) {
    return data.votingEndDate < data.eventDate;
  }
  return true;
}, {
  message: "Voting must end before the event starts",
  path: ["votingEndDate"],
});