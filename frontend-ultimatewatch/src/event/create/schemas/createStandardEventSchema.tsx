import { z } from "zod";

export const createStandardEventSchema = z.object({
  name: z
    .string()
    .min(3, "Event name must be at least 3 characters long"),

  description: z
    .string()
    .optional()
    .nullable(),

  eventDate: z
    .preprocess((arg) => {
      if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    }, z.date())
    .refine((date) => date > new Date(Date.now() + 300000), {
      message: "Event date must be at least five minutes after creation",
    }),

  maxMembers: z
    .coerce.number()
    .int("Must be an integer")
    .min(2, "An event requires a minimum of 2 members")
    .max(50, "An event can have up to 50 members"),

  mediaIds: z
    .array(z.number({ error: "Each media ID must be a number" }))
    .min(1, "A standard event must have at least one media")
    .max(20, "An event must have less or equal to 20 different media")
    .refine((items) => new Set(items).size === items.length, {
      message: "Media List must contain unique IDs",
    }),
});