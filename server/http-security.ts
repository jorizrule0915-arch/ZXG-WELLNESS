import type { VercelRequest, VercelResponse } from "@vercel/node";

const productionOrigins = new Set([
  "https://gxzhealthandwellness.com",
  "https://www.gxzhealthandwellness.com",
  "https://zxgwellness.com",
  "https://www.zxgwellness.com",
]);

function configuredOrigins() {
  return String(process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

export function isAllowedOrigin(req: VercelRequest) {
  const origin = Array.isArray(req.headers.origin) ? req.headers.origin[0] : req.headers.origin;
  if (!origin) return true;

  const normalized = origin.replace(/\/+$/, "");
  if (productionOrigins.has(normalized) || configuredOrigins().includes(normalized)) return true;

  try {
    const originUrl = new URL(normalized);
    const requestHost = Array.isArray(req.headers.host) ? req.headers.host[0] : req.headers.host;
    if (requestHost && originUrl.host === requestHost) return true;
  } catch {
    return false;
  }

  if (process.env.VERCEL_ENV !== "production") {
    try {
      const url = new URL(normalized);
      return url.hostname === "localhost" || url.hostname === "127.0.0.1";
    } catch {
      return false;
    }
  }

  return false;
}

export function setApiHeaders(req: VercelRequest, res: VercelResponse, methods = "POST, OPTIONS") {
  const origin = Array.isArray(req.headers.origin) ? req.headers.origin[0] : req.headers.origin;

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");

  if (origin && isAllowedOrigin(req)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
}

export function rejectDisallowedOrigin(req: VercelRequest, res: VercelResponse) {
  if (isAllowedOrigin(req)) return false;
  res.status(403).json({ error: "Origin is not allowed" });
  return true;
}

export function getClientIp(req: VercelRequest) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const value = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return value?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

export function publicErrorMessage(error: unknown, fallback = "Request failed") {
  const statusCode =
    typeof error === "object" && error && "statusCode" in error
      ? Number((error as { statusCode?: unknown }).statusCode)
      : 500;

  if (statusCode >= 400 && statusCode < 500 && error instanceof Error) {
    return error.message;
  }

  return fallback;
}
