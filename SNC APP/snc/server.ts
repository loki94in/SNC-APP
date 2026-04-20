import { Hono } from "hono";
import { cors } from "hono/cors";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = new Hono();

// ─── API Proxy to Backend ─────────────────────────────────────
app.use("*", cors());

// Proxy /api/* to backend running on port 3000
app.use("/api/*", async (c) => {
  const backendPort = parseInt(process.env.SNC_BACKEND_PORT || "3000");
  const url = `http://localhost:${backendPort}${c.req.path}`;
  const token = c.req.header("Authorization");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = token;

  try {
    const body = c.req.raw.body;
    const res = await fetch(url, {
      method: c.req.method,
      headers,
      body: body,
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return c.json({ error: "Backend unavailable" }, 502);
  }
});

// ─── SPA fallback (serves React app) ─────────────────────────
app.get("*", async (c) => {
  const indexPath = resolve(__dirname, "./index.html");
  if (!existsSync(indexPath)) {
    return c.html("<h1>index.html not found</h1>", 404);
  }
  const index = readFileSync(indexPath);
  return new Response(index, {
    headers: { "Content-Type": "text/html" },
  });
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 50826;

export default {
  fetch: app.fetch,
  port,
  idleTimeout: 255,
};