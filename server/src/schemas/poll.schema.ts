import { z } from "zod";

const timeOptionSchema = z
  .object({
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
  })
  .refine(
    (option) =>
      new Date(option.endTime) > new Date(option.startTime),
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export const createPollSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),

  timezone: z
    .string()
    .trim()
    .min(1, "Timezone is required"),

  options: z
    .array(timeOptionSchema)
    .min(1, "At least one time option is required")
    .max(50, "A poll cannot have more than 50 time options"),
});

export type CreatePollInput = z.infer<
  typeof createPollSchema
>;


export const updatePollSchema = z
 .object({
  title: z
   .string()
   .trim()
   .min(1, "Title is required")
   .max(100)
   .optional(),

  description: z
   .string()
   .trim()
   .max(500)
   .optional(),

  timezone: z
   .string()
   .trim()
   .min(1, "Timezone is required")
   .optional(),

  status: z
   .enum([
    "OPEN",
    "CLOSED",
    "FINALIZED",
   ])
   .optional(),
 })
 .refine(
  (data) => Object.keys(data).length > 0,
  {
   message: "At least one field must be provided",
  }
 );

export type UpdatePollInput = z.infer<
 typeof updatePollSchema
>;


export const finalizePollSchema = z.object({
  timeOptionId: z.number().int().positive(),
});