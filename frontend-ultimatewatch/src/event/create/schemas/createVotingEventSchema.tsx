import { z } from "zod";
import { EventVisibilityEnum } from "../../../enums/EventVisibility";

export const createVotingEventSchema = z.object({
  name: z
    .string()
    .min(3, "Event name must be at least 3 characters long"),

  description: z
    .string()
    .optional()
    .nullable(),

  visibility: z.nativeEnum(EventVisibilityEnum, {
    error: () => ({ message: "Please select a valid visibility option" }),
  }),

  eventDate: z
    .preprocess((arg) => (typeof arg === "string" || arg instanceof Date ? new Date(arg) : arg), z.date())
    .refine((date) => date > new Date(Date.now() + 600000), {
      message: "Event date must be at least ten minutes after creation",
    }),

  maxMembers: z
    .coerce.number()
    .int()
    .min(2, "Minimum 2 members")
    .max(50, "Maximum 50 members"),

  maxMedia: z
    .coerce.number()
    .int()
    .min(1, "At least one media must end up selected")
    .max(20, "An event must have less or equal to 20 different media"),

  maxVotesPerMember: z
    .coerce.number()
    .int()
    .min(1, "Event member should each get at least one vote"),

  votingEndDate: z
    .preprocess((arg) => (typeof arg === "string" || arg instanceof Date ? new Date(arg) : arg), z.date())
    .refine((date) => date > new Date(Date.now() + 300000), {
      message: "Voting period must last at least five minutes",
    }),

  proposedMediaIds: z
    .array(z.number())
    .min(1, "You must select at least one media to propose for voting")
    .max(50, "You cannot propose more than 50 media items"),

  isRecurring: z.boolean().default(false),
  
  weeks: z
    .preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      return Number(val);
    }, z.number().int().optional())
    .nullable()
    .optional()

}).refine((data) => data.votingEndDate < data.eventDate, {
  message: "Voting must end before the event starts",
  path: ["votingEndDate"],
}).refine((data) => data.maxVotesPerMember <= data.proposedMediaIds.length, {
  message: "Votes per member cannot exceed the number of proposed media items",
  path: ["maxVotesPerMember"],
}).refine((data) => {
  if (data.isRecurring) {
    if (data.weeks === null || data.weeks === undefined) return false;
    return data.weeks >= 2 && data.weeks <= 12;
  }
  return true;
}, {
  message: "Recurring events require between 2 and 12 weeks",
  path: ["weeks"],
});