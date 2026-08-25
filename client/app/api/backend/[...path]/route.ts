import type { NextRequest } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ??
  "https://scheduler-app-tto3.onrender.com";

const ALLOWED_METHODS = new Set([
  "GET",
  "POST",
  "PATCH",
  "PUT",
  "DELETE",
]);

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  if (!ALLOWED_METHODS.has(request.method)) {
    return Response.json(
      { message: "Method not allowed" },
      { status: 405 }
    );
  }

  const { path } = await context.params;
  const url = new URL(
    `/api/${path.map(encodeURIComponent).join("/")}`,
    BACKEND_API_URL
  );

  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  const headers = new Headers();
  headers.set("accept", "application/json");

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const organizerToken = request.headers.get("x-organizer-token");
  if (organizerToken) {
    headers.set("x-organizer-token", organizerToken);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    const body = await request.text();
    if (body) init.body = body;
  }

  try {
    const upstream = await fetch(url, init);
    const responseBody = await upstream.text();

    const responseHeaders = new Headers();
    const upstreamType = upstream.headers.get("content-type");
    if (upstreamType) responseHeaders.set("content-type", upstreamType);

    return new Response(responseBody, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      { message: "Unable to reach the Scheduler API" },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
