import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import bcrypt from "bcrypt";

const connectionString =
  process.env.DIRECT_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DIRECT_DATABASE_URL or DATABASE_URL must be set"
  );
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const SALT_ROUNDS = 12;

async function main() {
  const participants = await prisma.participant.findMany({
    where: {
      responseToken: {
        not: null,
      },
      responseTokenId: null,
      responseTokenHash: null,
    },
  });

  console.log(
    `Found ${participants.length} participant(s) to migrate.`
  );

  for (const participant of participants) {
    if (!participant.responseToken) {
      continue;
    }

    const responseTokenId = crypto.randomUUID();

    const responseTokenHash = await bcrypt.hash(
      participant.responseToken,
      SALT_ROUNDS
    );

    await prisma.participant.update({
      where: {
        id: participant.id,
      },
      data: {
        responseTokenId,
        responseTokenHash,
      },
    });

    console.log(
      `Migrated participant ${participant.id}`
    );
  }

  console.log("Participant token backfill completed.");
}

main()
  .catch((error) => {
    console.error(
      "Participant token backfill failed:",
      error
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });