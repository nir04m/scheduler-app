import prisma from "../libs/prisma";
import type {
  CreatePollInput,
  UpdatePollInput,
} from "../schemas/poll.schema";
import {
  hashToken,
  verifyToken,
} from "../utils/token";

export async function createPoll(
  data: CreatePollInput
) {
  const publicId = crypto.randomUUID();
  const organizerToken = crypto.randomUUID();

  const organizerTokenHash =
    await hashToken(organizerToken);

  const poll = await prisma.poll.create({
    data: {
      publicId,

      // Store only the hash in PostgreSQL
      organizerToken: organizerTokenHash,

      title: data.title,
      description: data.description,
      timezone: data.timezone,

      timeOptions: {
        create: data.options.map((option) => ({
          startTime: new Date(option.startTime),
          endTime: new Date(option.endTime),
        })),
      },
    },

    include: {
      timeOptions: true,
    },
  });

  // Return the raw token only when the poll is created.
  // The database contains only the hash.
  return {
    ...poll,
    organizerToken,
  };
}

export async function getPollByPublicId(
  publicId: string
) {
  return prisma.poll.findUnique({
    where: {
      publicId,
    },

    select: {
      id: true,
      publicId: true,
      title: true,
      description: true,
      timezone: true,
      status: true,
      finalTimeOptionId: true,
      createdAt: true,
      updatedAt: true,

      finalTimeOption: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
        },
      },

      timeOptions: {
        orderBy: {
          startTime: "asc",
        },

        select: {
          id: true,
          startTime: true,
          endTime: true,
          createdAt: true,
        },
      },

      participants: {
        orderBy: {
          createdAt: "asc",
        },

        select: {
          id: true,
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
      },
    },
  });
}

export async function updatePoll(
  publicId: string,
  organizerToken: string,
  data: UpdatePollInput
) {
  const poll = await prisma.poll.findUnique({
    where: {
      publicId,
    },
  });

  if (!poll) {
    throw new Error("POLL_NOT_FOUND");
  }

  const tokenIsValid = await verifyToken(
    organizerToken,
    poll.organizerToken
  );

  if (!tokenIsValid) {
    throw new Error("INVALID_ORGANIZER_TOKEN");
  }

  return prisma.poll.update({
    where: {
      id: poll.id,
    },

    data,

    select: {
      id: true,
      publicId: true,
      title: true,
      description: true,
      timezone: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function finalizePoll(
  publicId: string,
  organizerToken: string,
  timeOptionId: number
) {
  const poll = await prisma.poll.findUnique({
    where: {
      publicId,
    },

    include: {
      timeOptions: true,
    },
  });

  if (!poll) {
    throw new Error("POLL_NOT_FOUND");
  }

  const tokenIsValid = await verifyToken(
    organizerToken,
    poll.organizerToken
  );

  if (!tokenIsValid) {
    throw new Error("INVALID_ORGANIZER_TOKEN");
  }

  const selectedOption = poll.timeOptions.find(
    (option) => option.id === timeOptionId
  );

  if (!selectedOption) {
    throw new Error("INVALID_TIME_OPTION");
  }

  return prisma.poll.update({
    where: {
      id: poll.id,
    },

    data: {
      status: "FINALIZED",
      finalTimeOptionId: selectedOption.id,
    },

    select: {
      id: true,
      publicId: true,
      title: true,
      description: true,
      timezone: true,
      status: true,
      finalTimeOptionId: true,
      updatedAt: true,

      finalTimeOption: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  });
}


