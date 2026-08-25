import type { Request, Response } from "express";
import { z } from "zod";

import { participantResponseSchema, updateParticipantResponseSchema } from "../schemas/participant.schema";
import { createParticipantResponse, updateParticipantResponse } from "../services/participants.service";
import { logError } from "../utils/logger";

export async function createParticipantResponseController(
  req: Request,
  res: Response
) {
  try {
    const validation = participantResponseSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid participant response",
        errors: z.treeifyError(validation.error),
      });
    }

    const publicId = req.params.publicId;

    if (typeof publicId !== "string") {
        return res.status(400).json({
            message: "Invalid poll ID"
        });
    }

    const participant = await createParticipantResponse({
      publicId,
      ...validation.data,
    });

    return res.status(201).json(participant);
  } catch (error) {
    logError("Failed to create participant response", error);

    if (error instanceof Error) {
      if (error.message === "POLL_NOT_FOUND") {
        return res.status(404).json({
          message: "Poll not found",
        });
      }

      if (error.message === "POLL_NOT_OPEN") {
        return res.status(409).json({
          message: "This poll is no longer accepting responses",
        });
      }

      if (error.message === "INVALID_TIME_OPTION") {
        return res.status(400).json({
          message: "One or more time options do not belong to this poll",
        });
      }
    }

    return res.status(500).json({
      message: "Failed to submit availability",
    });
  }
}




export async function updateParticipantResponseController(
    req: Request,
    res: Response
  ) {
    try {
      const validation = updateParticipantResponseSchema.safeParse(
        req.body
      );
  
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid participant response",
          errors: z.treeifyError(validation.error),
        });
      }
  
      const publicId = req.params.publicId;
      const responseToken = req.params.responseToken;
  
      if (
        typeof publicId !== "string" ||
        typeof responseToken !== "string"
      ) {
        return res.status(400).json({
          message: "Invalid request parameters",
        });
      }
  
      const participant = await updateParticipantResponse({
        publicId,
        responseToken,
        ...validation.data,
      });
  
      return res.status(200).json(participant);
    } catch (error) {
     logError("Failed to update participant response", error);
  
      if (error instanceof Error) {
        if (error.message === "PARTICIPANT_NOT_FOUND") {
          return res.status(404).json({
            message: "Participant response not found",
          });
        }
  
        if (error.message === "POLL_NOT_OPEN") {
          return res.status(409).json({
            message: "This poll is no longer accepting responses",
          });
        }
  
        if (error.message === "INVALID_TIME_OPTION") {
          return res.status(400).json({
            message:
              "One or more time options do not belong to this poll",
          });
        }
      }
  
      return res.status(500).json({
        message: "Failed to update availability",
      });
    }
  }









