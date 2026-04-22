import { Hono } from "hono";
import { db } from "../db.js";

const cfg = new Hono();

// GET /api/config/login_bypass → { enabled: bool}
cfg.get("/login_bypass", async (c) => {
  const row = db.prepare("SELECT value FROM app_config WHERE key='login_bypass").get() as { value: string } | undefined;
  return c.json({ enabled: row?.value === "true" });
});

// PUT /api/config/login_bypass → { enabled: bool }
cfg.put("/login_bypass", async (c) => {
  const user = c.get("user") as any;
  if (user?.role !== "ADMIN") return c.json({ error: "Admin only" }, 403);
  const { enabled } = await c.req.json();
  const val = enabled ? "true" : "false";
  db.prepare("INSERT OR REPLACE INTO app_config (id, key, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(
    "cfg_login_bypass", "login_bypass", val, new Date().toISOString(), new Date().toISOString()
  );
  return c.json({ enabled: enabled });
});

export default cfg;
