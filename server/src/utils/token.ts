import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export async function hashToken(
  token: string
): Promise<string> {
  return bcrypt.hash(token, SALT_ROUNDS);
}

export async function verifyToken(
  token: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(token, hash);
}

export async function createParticipantToken() {
  const tokenId = crypto.randomUUID();
  const secret = crypto.randomUUID();

  const tokenHash = await hashToken(secret);

  return {
    tokenId,
    tokenHash,
    token: `${tokenId}.${secret}`,
  };
}

export function parseParticipantToken(
  token: string
): {
  tokenId: string;
  secret: string;
} | null {
  const separatorIndex = token.indexOf(".");

  if (separatorIndex === -1) {
    return null;
  }

  const tokenId = token.slice(0, separatorIndex);
  const secret = token.slice(separatorIndex + 1);

  if (!tokenId || !secret) {
    return null;
  }

  return {
    tokenId,
    secret,
  };
}