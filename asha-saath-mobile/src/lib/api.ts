import { randomUUID } from "expo-crypto";
import type { Actor, MobileState } from "./types";
export interface ApiResult {
  state: MobileState;
  session: Actor;
  version: number;
  result?: unknown;
  token?: string;
  expiresAt?: number;
  actors?: Actor[];
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}
export function normalizeBase(value: string) {
  const trimmed = value.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  const url = new URL(trimmed);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !["http:", "https:"].includes(url.protocol) ||
    url.pathname !== "/"
  )
    throw new Error(
      "Enter the server origin only, for example https://your-server.example",
    );
  const local =
    /^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(
      url.hostname,
    );
  if (url.protocol !== "https:" && !local)
    throw new Error(
      "Public servers must use HTTPS. HTTP is allowed only for local testing.",
    );
  return url.origin;
}
export async function apiRequest(
  base: string,
  path: string,
  token: string | null,
  body?: unknown,
) {
  base = normalizeBase(base);
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 15000);
  try {
    const response = await fetch(`${base}/api/${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Accept: "application/json",
        "X-ASHA-Client": "1",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "omit",
      cache: "no-store",
      signal: abort.signal,
    });
    const result = await response.json();
    if (!response.ok)
      throw new ApiError(
        result.error?.message ??
          result.message ??
          "The server could not complete this action.",
        response.status,
        result.error?.code,
      );
    return result;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new Error(
      "Cannot reach the server. Check your connection and server address; no change is confirmed.",
    );
  } finally {
    clearTimeout(timeout);
  }
}
export const commandEnvelope = (
  name: string,
  args: unknown[],
  version: number,
) => ({ name, args, expectedVersion: version, idempotencyKey: randomUUID() });
