import { existsSync, statSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join, resolve } from "node:path";
import { loadEnv, type Plugin } from "vite";

/**
 * Serves api/ during `npm run dev`, the way Vercel serves it in the cloud:
 * `/api/orders` → api/orders/index.ts, `/api/orders/<id>/pay` →
 * api/orders/[id]/pay.ts, with the bracketed segments arriving in
 * `req.query`. Modules load through Vite's SSR loader, so an edit to a
 * function is live on the next request — no restart, no `vercel dev`, no
 * Vercel login on either PC.
 *
 * Only the handful of request/response conveniences the functions use are
 * shimmed (`req.body`, `req.query`, `res.status().json()`); the real
 * runtime is what the preview deployment exercises.
 */
export function apiDevPlugin(): Plugin {
  return {
    name: "jara-api-dev",
    apply: "serve",

    configureServer(server) {
      const root = server.config.root;
      const apiDir = resolve(root, "api");

      // .env / .env.local for the functions — every key, not just VITE_*.
      const env = loadEnv(server.config.mode, root, "");
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) process.env[key] = value;
      }

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        if (!url.pathname.startsWith("/api/")) return next();

        const match = resolveHandler(apiDir, url.pathname.slice("/api/".length));
        if (!match) {
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: `No function for ${url.pathname}` }));
          return;
        }

        try {
          const mod = (await server.ssrLoadModule(match.file)) as {
            default?: (req: IncomingMessage, res: ServerResponse) => Promise<void> | void;
          };
          if (typeof mod.default !== "function") throw new Error(`${match.file} has no default export`);

          const query: Record<string, string> = { ...match.params };
          url.searchParams.forEach((v, k) => (query[k] = v));

          const vreq = Object.assign(req, { query, cookies: {}, body: await readBody(req) });
          const vres = Object.assign(res, {
            status(code: number) {
              res.statusCode = code;
              return vres;
            },
            json(body: unknown) {
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify(body));
              return vres;
            },
            send(body: unknown) {
              if (typeof body === "string" || Buffer.isBuffer(body)) res.end(body);
              else vres.json(body);
              return vres;
            },
            redirect(statusOrUrl: number | string, maybeUrl?: string) {
              const [code, target] = typeof statusOrUrl === "number" ? [statusOrUrl, maybeUrl ?? "/"] : [307, statusOrUrl];
              res.statusCode = code;
              res.setHeader("Location", target);
              res.end();
              return vres;
            },
          });

          await mod.default(vreq, vres);
          if (!res.writableEnded) res.end();
        } catch (err) {
          server.ssrFixStacktrace(err as Error);
          console.error(`[api-dev] ${req.method} ${url.pathname}`, err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
          }
          if (!res.writableEnded) res.end(JSON.stringify({ error: (err as Error).message }));
        }
      });
    },
  };
}

/** Vercel's file routing, reduced to what this project uses. */
function resolveHandler(apiDir: string, path: string): { file: string; params: Record<string, string> } | null {
  const segments = path.split("/").filter(Boolean);
  const params: Record<string, string> = {};
  let dir = apiDir;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const last = i === segments.length - 1;

    if (last) {
      for (const candidate of [`${segment}.ts`, join(segment, "index.ts")]) {
        const file = join(dir, candidate);
        if (existsSync(file)) return { file, params };
      }
      const dynamic = dynamicEntry(dir);
      if (dynamic) {
        params[dynamic.name] = decodeURIComponent(segment);
        for (const candidate of [`${dynamic.entry}.ts`, join(dynamic.entry, "index.ts")]) {
          const file = join(dir, candidate);
          if (existsSync(file)) return { file, params };
        }
      }
      return null;
    }

    const literal = join(dir, segment);
    if (existsSync(literal) && statSync(literal).isDirectory()) {
      dir = literal;
      continue;
    }
    const dynamic = dynamicEntry(dir);
    if (dynamic && existsSync(join(dir, dynamic.entry)) && statSync(join(dir, dynamic.entry)).isDirectory()) {
      params[dynamic.name] = decodeURIComponent(segment);
      dir = join(dir, dynamic.entry);
      continue;
    }
    return null;
  }
  return null;
}

/** The single `[name]` entry (file or directory) in a folder, if any. */
function dynamicEntry(dir: string): { entry: string; name: string } | null {
  // Only "[id]" is used in this project; keep the lookup literal and cheap.
  for (const name of ["id"]) {
    if (existsSync(join(dir, `[${name}]`)) || existsSync(join(dir, `[${name}].ts`))) {
      return { entry: `[${name}]`, name };
    }
  }
  return null;
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const method = req.method ?? "GET";
  if (method === "GET" || method === "HEAD") return undefined;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return undefined;
  const type = req.headers["content-type"] ?? "";
  if (type.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  if (type.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(text));
  }
  return text;
}
