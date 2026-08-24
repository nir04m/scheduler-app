import { z } from "zod";

export const participantResponseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters"),

  responses: z
    .array(
      z.object({
        timeOptionId: z.number().int().positive(),

        status: z.enum([
          "AVAILABLE",
          "MAYBE",
          "UNAVAILABLE",
        ]),
      })
    )
    .min(1, "At least one availability response is required"),
});

export type ParticipantResponseInput = z.infer<
  typeof participantResponseSchema
>;


export const updateParticipantResponseSchema = z.object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(100, "Name cannot exceed 100 characters")
      .optional(),
  
    responses: z
      .array(
        z.object({
          timeOptionId: z.number().int().positive(),
  
          status: z.enum([
            "AVAILABLE",
            "MAYBE",
            "UNAVAILABLE",
          ]),
        })
      )
      .min(1, "At least one availability response is required"),
  });
  
  export type UpdateParticipantResponseInput = z.infer<
    typeof updateParticipantResponseSchema
  >;

