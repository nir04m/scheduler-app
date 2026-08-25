import type {
  AvailabilityStatus,
  CreatePollResponse,
  ParticipantResponse,
  Poll,
} from "@/lib/types";

const API_ROOT = "/api/backend";

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body?.message ??
      body?.error ??
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body as T;
}

export async function createPoll(input: {
  title: string;
  description?: string;
  timezone: string;
  options: Array<{ startTime: string; endTime: string }>;
}) {
  const response = await fetch(`${API_ROOT}/polls`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  return readJson<CreatePollResponse>(response);
}

export async function getPoll(publicId: string) {
  const response = await fetch(
    `${API_ROOT}/polls/${encodeURIComponent(publicId)}`,
    { cache: "no-store" }
  );

  return readJson<Poll>(response);
}

export async function submitAvailability(input: {
  publicId: string;
  name: string;
  responses: Array<{
    timeOptionId: number;
    status: AvailabilityStatus;
  }>;
}) {
  const response = await fetch(
    `${API_ROOT}/polls/${encodeURIComponent(input.publicId)}/responses`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: input.name,
        responses: input.responses,
      }),
    }
  );

  return readJson<ParticipantResponse>(response);
}

export async function updateAvailability(input: {
    publicId: string;
    responseToken: string;
    name?: string;
    responses: Array<{
      timeOptionId: number;
      status: AvailabilityStatus;
    }>;
  }) {
    const response = await fetch(
      `${API_ROOT}/polls/${encodeURIComponent(
        input.publicId
      )}/responses/${encodeURIComponent(
        input.responseToken
      )}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: input.name,
          responses: input.responses,
        }),
      }
    );
  
    return readJson<
      Omit<ParticipantResponse, "responseToken">
    >(response);
}

export async function updatePoll(
  publicId: string,
  organizerToken: string,
  input: {
    title?: string;
    description?: string;
    timezone?: string;
  }
) {
  const response = await fetch(
    `${API_ROOT}/polls/${encodeURIComponent(publicId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-organizer-token": organizerToken,
      },
      body: JSON.stringify(input),
    }
  );

  return readJson<Partial<Poll>>(response);
}

export async function finalizePoll(
  publicId: string,
  organizerToken: string,
  timeOptionId: number
) {
  const url =
    `${API_ROOT}/polls/${encodeURIComponent(publicId)}/finalize`;

  const request = (method: "POST" | "PATCH") =>
    fetch(url, {
      method,
      headers: {
        "content-type": "application/json",
        "x-organizer-token": organizerToken,
      },
      body: JSON.stringify({ timeOptionId }),
    });

  let response = await request("POST");

  // Supports either common route definition while keeping the UI unchanged.
  if (response.status === 404 || response.status === 405) {
    response = await request("PATCH");
  }

  return readJson<Partial<Poll>>(response);
}
