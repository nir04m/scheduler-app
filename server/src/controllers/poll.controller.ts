import type { Request, Response } from "express";
import { createPoll, getPollByPublicId, updatePoll, finalizePoll } from "../services/poll.service";
import { createPollSchema, updatePollSchema, finalizePollSchema} from "../schemas/poll.schema";
import { z } from "zod"

export async function createPollController(
    req: Request,
    res: Response
) {
    try {
        const result = createPollSchema.safeParse(req.body);

        if(!result.success) {
            return res.status(400).json({
                message: "Invalid poll data",
                errors: z.treeifyError(result.error),
            });
        }

        const poll = await createPoll(result.data);

        return res.status(201).json(poll);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create poll",
        });
    }
}

export async function getPollController(
    req: Request<{ publicId: string }>,
    res: Response
) {
    try {
        const { publicId } = req.params;
        const poll = await getPollByPublicId(publicId);

        if (!poll) {
            return res.status(404).json({
                message: "Poll not found",
            });
        }

        res.status(200).json(poll);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to get poll",
        });
    }
}

export async function updatePollController(
     req: Request,
     res: Response
    ) {
        try {
            const publicId = req.params.publicId;
            
            if (typeof publicId !== "string") {
                return res.status(400).json({
                    message: "Invalid poll ID",
                });
            }
            
            const organizerToken =
            req.header("X-Organizer-Token");
            
            if (!organizerToken) {
                return res.status(401).json({
                    message: "Organizer token is required",
                });
            }
            
            const validation =
            updatePollSchema.safeParse(req.body);
            
            if (!validation.success) {
                return res.status(400).json({
                    message: "Invalid poll data",
                    errors: z.treeifyError(
                        validation.error
                    ),
                });
            }
            
            const poll = await updatePoll(
                publicId,
                organizerToken,
                validation.data
            );
            
            return res.status(200).json(poll);
        } catch (error) {
            console.error(error);
            
            if (error instanceof Error) {
                if (error.message === "POLL_NOT_FOUND") {
                    return res.status(404).json({
                        message: "Poll not found",
                    });
                }
                
                if (
                    error.message ===
                    "INVALID_ORGANIZER_TOKEN"
                ) {
                    return res.status(403).json({
                        message: "Not authorized to modify this poll",
                    });
                }
            }
            
            return res.status(500).json({
                message: "Failed to update poll",
            });
        }
    }




export async function finalizePollController(
  req: Request,
  res: Response
) {
  try {
    const publicId = req.params.publicId;

    if (typeof publicId !== "string") {
      return res.status(400).json({
        message: "Invalid poll ID",
      });
    }

    const organizerToken =
      req.header("X-Organizer-Token");

    if (!organizerToken) {
      return res.status(401).json({
        message: "Organizer token is required",
      });
    }

    const validation =
      finalizePollSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid final time selection",
        errors: z.treeifyError(
          validation.error
        ),
      });
    }

    const poll = await finalizePoll(
      publicId,
      organizerToken,
      validation.data.timeOptionId
    );

    return res.status(200).json(poll);
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      if (error.message === "POLL_NOT_FOUND") {
        return res.status(404).json({
          message: "Poll not found",
        });
      }

      if (
        error.message ===
        "INVALID_ORGANIZER_TOKEN"
      ) {
        return res.status(403).json({
          message: "Not authorized to modify this poll",
        });
      }

      if (
        error.message ===
        "INVALID_TIME_OPTION"
      ) {
        return res.status(400).json({
          message:
            "Selected time option does not belong to this poll",
        });
      }
    }

    return res.status(500).json({
      message: "Failed to finalize poll",
    });
  }
}


