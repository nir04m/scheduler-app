import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DIRECT_DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const polls = await prisma.poll.findMany({
    where: {
      organizerToken: {
        equals: "",
      },
    },
  });

  for (const poll of polls) {
    await prisma.poll.update({
      where: {
        id: poll.id,
      },
      data: {
        organizerToken: crypto.randomUUID(),
      },
    });
  }

  console.log(`Updated ${polls.length} poll(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });