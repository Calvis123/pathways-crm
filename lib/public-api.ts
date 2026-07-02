import { NextResponse } from "next/server";

function getAllowedOrigins() {
  const raw = process.env.PUBLIC_API_ALLOWED_ORIGINS;
  if (!raw) return ["*"];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function resolveAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = getAllowedOrigins();

  if (allowed.includes("*")) return "*";
  if (!origin) return null;
  if (allowed.includes(origin)) return origin;
  return null;
}

export function getPublicCorsHeaders(request: Request, methods = "POST, OPTIONS") {
  const allowOrigin = resolveAllowedOrigin(request);
  const headers = new Headers();

  if (allowOrigin) {
    headers.set("Access-Control-Allow-Origin", allowOrigin);
    headers.set("Vary", "Origin");
  }

  headers.set("Access-Control-Allow-Methods", methods);
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Max-Age", "86400");
  return headers;
}

export function jsonWithPublicCors(
  request: Request,
  data: unknown,
  init?: ResponseInit
) {
  const headers = getPublicCorsHeaders(request);
  const responseHeaders = new Headers(init?.headers);
  headers.forEach((value, key) => responseHeaders.set(key, value));

  return NextResponse.json(data, {
    ...init,
    headers: responseHeaders
  });
}

export function optionsWithPublicCors(request: Request, methods = "POST, OPTIONS") {
  return new NextResponse(null, {
    status: 204,
    headers: getPublicCorsHeaders(request, methods)
  });
}

export function getPublicRequestSite(request: Request) {
  const rawSite = request.headers.get("origin") ?? request.headers.get("referer");
  if (!rawSite) return null;

  try {
    return new URL(rawSite).hostname;
  } catch {
    return rawSite.trim() || null;
  }
}
