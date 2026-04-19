import { z } from "zod";

export const createEventSchema = z.object({
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
});