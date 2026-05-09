import { z } from "zod";
import { EventVisibilityEnum } from "../../../../enums/EventVisibility";

const standardBase = z.object({
  name: z.string().min(3),
  description: z.string().optional().nullable(),
  visibility: z.nativeEnum(EventVisibilityEnum, {
    error: () => ({ message: "Please select a valid visibility option" }),
  }),
  eventDate: z.preprocess((arg) => (typeof arg === "string" || arg instanceof Date ? new Date(arg) : arg), z.date()),
  maxMembers: z.coerce.number().int().min(2, "Minimum 2 members").max(50, "Maximum 50 members"),
});

export const updateStandardEventSchema = standardBase.partial();