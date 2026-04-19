import { Hono } from "hono";
import { db, now } from "../db.js";
import { v4 as uid } from "uuid";
import { audit } from "../audit.js";
const roles = new Hono();

roles.get("/permissions", async (c) => {
  const perms = db.prepare("SELECT * FROM permissions ORDER BY role, screen").all();
  return c.json({ permissions: perms });
});

roles.put("/permissions", async (c) => {
  const user = c.get("user") as any;
  if (user.role !== "ADMIN") return c.json({ error: "Forbidden" }, 403);
  const { permissions } = await c.req.json();
  const update = db.prepare("INSERT OR REPLACE INTO permissions (id, role, screen, level) VALUES (?, ?, ?, ?)");
  for (const p of permissions) {
    const existing = db.prepare("SELECT id FROM permissions WHERE role=? AND screen=?").get(p.role, p.screen) as any;
    update.run(existing?.id || uid(), p.role, p.screen, p.level);
  }
  audit("PERMISSIONS_UPDATED", user.id, "Permission matrix updated");
  return c.json({ ok: true });
});

roles.get("/roles", async (c) => {
  const rows = db.prepare("SELECT DISTINCT role FROM permissions").all() as any[];
  return c.json({ roles: rows.map(r => r.role) });
});

export default roles;
