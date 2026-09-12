import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { ZodType } from "zod";
import { brand } from "../../src/data/brand";

/**
 * The little that every function shares: typed errors, JSON replies, body
 * validation and the site's own origin (for redirect and webhook URLs).
 *
 * Files under api/_lib are helpers, not routes — Vercel skips underscored
 * paths when it turns api/ into functions.
 */

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function json(res: VercelResponse, status: number, body: unknown): void {
  res.status(status).setHeader("Cache-Control", "no-store").json(body);
}

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void>;

/** Wrap a handler so thrown HttpErrors become JSON replies and anything else a clean 500. */
export function handler(methods: string[], fn: Handler): Handler {
  return async (req, res) => {
    if (!methods.includes(req.method ?? "")) {
      res.setHeader("Allow", methods.join(", "));
      json(res, 405, { error: "Method not allowed" });
      return;
    }
    try {
      await fn(req, res);
    } catch (err) {
      if (err instanceof HttpError) {
        json(res, err.status, { error: err.message, code: err.code });
        return;
      }
      console.error("[api] unhandled", err);
      json(res, 500, { error: "Internal error" });
    }
  };
}

/** Parse and validate the JSON body; Vercel has already decoded JSON into `req.body`. */
export function readBody<T>(req: VercelRequest, schema: ZodType<T>): T {
  const raw: unknown = typeof req.body === "string" ? safeParse(req.body) : req.body;
  const result = schema.safeParse(raw ?? {});
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new HttpError(400, `${issue?.path.join(".") || "body"}: ${issue?.message ?? "invalid"}`, "invalid_body");
  }
  return result.data;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** One string out of a query value that may be an array. */
export function queryParam(req: VercelRequest, name: string): string | undefined {
  const value = req.query[name];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Where this deployment is reachable — the base of every redirect, webhook
 * and email link. `SITE_URL` wins when set; production falls back to the
 * real domain (so no email ever links to a `*.vercel.app` address); a preview
 * uses Vercel's own URL; the dev server uses the request's host.
 */
export function siteUrl(req: VercelRequest): string {
  const configured = process.env.SITE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  if (process.env.VERCEL_ENV === "production") return brand.websiteUrl;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const proto = (req.headers["x-forwarded-proto"] as string | undefined) ?? "http";
  return `${proto}://${req.headers.host ?? "localhost"}`;
}

export function clientIp(req: VercelRequest): string {
  const fwd = req.headers["x-forwarded-for"];
  const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0]?.trim();
  return first ?? req.socket?.remoteAddress ?? "";
}
