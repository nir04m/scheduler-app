import { Router } from "express";

import { createPollController, getPollController, updatePollController, finalizePollController} from "../controllers/poll.controller";

import { createParticipantResponseController, updateParticipantResponseController} from "../controllers/participant.controller";

const router = Router();

router.post("/", createPollController);

router.get("/:publicId", getPollController);

router.patch( "/:publicId", updatePollController);

router.post("/:publicId/finalize", finalizePollController);

router.post( "/:publicId/responses", createParticipantResponseController);

router.patch( "/:publicId/responses/:responseToken", updateParticipantResponseController);

export default router;