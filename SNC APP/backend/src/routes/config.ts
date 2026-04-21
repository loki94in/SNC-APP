import { Hono } from "hono";
import { db, now } from "./db.js";

const config = new Hono();

// GET /api/config → get app settings
config.get("/", async (c) => {
  const rows = db.prepare("SELECT key, value FROM app_config").all() as any[];
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return c.json({ config: map });
});

// PUT /api/config → update settings (ADMIN only)
config.put("/", async (c) => {
  const user = c.get("user") as any;
  if (user?.role !== "ADMIN") return c.json({ error: "Forbidden" }, 403);
  const { key, value } = await c.req.json();
  if (!key) return c.json({ error: "key required" }, 400);
  db.prepare("INSERT OR REPLACE INTO app_config (id, key, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
    .run(crypto.randomUUID(), key, String(value), now(), now());
  return c.json({ ok: true });
});

export default config;
