import prisma from "../libs/prisma.js";
import {
  createParticipantToken,
  parseParticipantToken,
  verifyToken,
} from "../utils/token.js";

type AvailabilityInput = {
  timeOptionId: number;
  status: "AVAILABLE" | "MAYBE" | "UNAVAILABLE";
};

type CreateParticipantResponseInput = {
  publicId: string;
  name: string;
  responses: AvailabilityInput[];
};

export async function createParticipantResponse(
  data: CreateParticipantResponseInput
) {
  const poll = await prisma.poll.findUnique({
    where: {
      publicId: data.publicId,
    },
    include: {
      timeOptions: true,
    },
  });

  if (!poll) {
    throw new Error("POLL_NOT_FOUND");
  }

  if (poll.status !== "OPEN") {
    throw new Error("POLL_NOT_OPEN");
  }

  const validTimeOptionIds = new Set(
    poll.timeOptions.map((option) => option.id)
  );

  for (const response of data.responses) {
    if (!validTimeOptionIds.has(response.timeOptionId)) {
      throw new Error("INVALID_TIME_OPTION");
    }
  }

  const {
    tokenId,
    tokenHash,
    token: responseToken,
  } = await createParticipantToken();

  const participant = await prisma.participant.create({
    data: {
      pollId: poll.id,
      name: data.name,

      responseTokenId: tokenId,
      responseTokenHash: tokenHash,

      availabilities: {
        create: data.responses.map((response) => ({
          timeOptionId: response.timeOptionId,
          status: response.status,
        })),
      },
    },

    include: {
      availabilities: true,
    },
  });

  return {
    id: participant.id,
    pollId: participant.pollId,
    name: participant.name,
    responseToken,
    createdAt: participant.createdAt,
    updatedAt: participant.updatedAt,
    availabilities: participant.availabilities,
  };
}

type UpdateParticipantResponseInput = {
  publicId: string;
  responseToken: string;
  name?: string;
  responses: AvailabilityInput[];
};

export async function updateParticipantResponse(
  data: UpdateParticipantResponseInput
) {
  const parsedToken = parseParticipantToken(
    data.responseToken
  );

  if (!parsedToken) {
    throw new Error("PARTICIPANT_NOT_FOUND");
  }

  const participant =
    await prisma.participant.findUnique({
      where: {
        responseTokenId: parsedToken.tokenId,
      },

      include: {
        poll: {
          include: {
            timeOptions: true,
          },
        },
      },
    });

  if (
    !participant ||
    !participant.responseTokenHash
  ) {
    throw new Error("PARTICIPANT_NOT_FOUND");
  }

  const tokenIsValid = await verifyToken(
    parsedToken.secret,
    participant.responseTokenHash
  );

  if (!tokenIsValid) {
    throw new Error("PARTICIPANT_NOT_FOUND");
  }

  if (participant.poll.publicId !== data.publicId) {
    throw new Error("PARTICIPANT_NOT_FOUND");
  }

  if (participant.poll.status !== "OPEN") {
    throw new Error("POLL_NOT_OPEN");
  }

  const validTimeOptionIds = new Set(
    participant.poll.timeOptions.map(
      (option) => option.id
    )
  );

  for (const response of data.responses) {
    if (!validTimeOptionIds.has(response.timeOptionId)) {
      throw new Error("INVALID_TIME_OPTION");
    }
  }

  return prisma.$transaction(async (tx) => {
    if (data.name !== undefined) {
      await tx.participant.update({
        where: {
          id: participant.id,
        },
        data: {
          name: data.name,
        },
      });
    }

    for (const response of data.responses) {
      await tx.availability.upsert({
        where: {
          participantId_timeOptionId: {
            participantId: participant.id,
            timeOptionId: response.timeOptionId,
          },
        },

        update: {
          status: response.status,
        },

        create: {
          participantId: participant.id,
          timeOptionId: response.timeOptionId,
          status: response.status,
        },
      });
    }

    return tx.participant.findUnique({
      where: {
        id: participant.id,
      },

      select: {
        id: true,
        pollId: true,
        name: true,
        createdAt: true,
        updatedAt: true,

        availabilities: {
          select: {
            id: true,
            timeOptionId: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  });
}