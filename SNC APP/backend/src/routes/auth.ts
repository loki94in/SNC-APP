import { Hono } from "hono";
import { compareSync, hashSync } from "bcryptjs";
import { v4 as uid } from "uuid";
import { sign, verify } from "jsonwebtoken";
import { db, now } from "../db.js";
import { audit } from "../audit.js";

const JWT_SECRET = process.env.JWT_SECRET || "snc-secret-key-change-in-production";
const auth = new Hono();

auth.post("/login", async (c) => {
  const { loginId, password } = await c.req.json();
  if (!loginId || !password) return c.json({ error: "Missing credentials" }, 400);
  const user = db.prepare("SELECT * FROM users WHERE login_id = ? AND active = 1").get(loginId) as any;
  if (!user || !compareSync(password, user.password_hash)) {
    audit("LOGIN_FAILED", null, `Failed login attempt: ${loginId}`);
    return c.json({ error: "Invalid credentials" }, 401);
  }
  const token = sign({ id: user.id, login_id: user.login_id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
  audit("LOGIN_SUCCESS", user.id, `User logged in: ${user.login_id}`);
  return c.json({ token, user: { id: user.id, login_id: user.login_id, name: user.name, role: user.role }, mustChangePassword: !!user.must_change_password });
});

auth.post("/logout", async (c) => {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      const payload = verify(token, JWT_SECRET) as any;
      audit("LOGOUT", payload.id, `User logged out`);
    } catch {}
  }
  return c.json({ ok: true });
});

auth.get("/me", async (c) => {
  const user = c.get("user") as any;
  return c.json({ user });
});

auth.get("/permissions", async (c) => {
  const user = c.get("user") as any;
  const perms = db.prepare("SELECT screen, level FROM permissions WHERE role = ?").all(user.role) as any[];
  const map: Record<string, string> = {};
  for (const p of perms) map[p.screen] = p.level;
  return c.json({ permissions: map, role: user.role });
});

auth.post("/change-password", async (c) => {
  const user = c.get("user") as any;
  const { currentPassword, newPassword } = await c.req.json();
  if (!compareSync(currentPassword, user.password_hash)) return c.json({ error: "Current password incorrect" }, 400);
  if (newPassword.length < 8) return c.json({ error: "Min 8 characters" }, 400);
  db.prepare("UPDATE users SET password_hash=?, must_change_password=0, updated_at=? WHERE id=?"
  ).run(hashSync(newPassword, 10), now(), user.id);
  audit("PASSWORD_CHANGED", user.id, "User changed password");
  return c.json({ ok: true });
});

auth.post("/users", async (c) => {
  const user = c.get("user") as any;
  if (user.role !== "ADMIN") return c.json({ error: "Forbidden" }, 403);
  const { loginId, password, name, role } = await c.req.json();
  if (!loginId || !password || !name) return c.json({ error: "Missing fields" }, 400);
  if (db.prepare("SELECT id FROM users WHERE login_id = ?").get(loginId)) return c.json({ error: "Login ID taken" }, 400);
  const id = uid();
  db.prepare(`INSERT INTO users (id, login_id, password_hash, name, role, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
  ).run(id, loginId, hashSync(password, 10), name, role||"RECEPTIONIST", now(), now());
  audit("USER_CREATED", user.id, `Created user: ${loginId}`);
  return c.json({ ok: true, id }, 201);
});

auth.get("/users", async (c) => {
  const user = c.get("user") as any;
  if (user.role !== "ADMIN") return c.json({ error: "Forbidden" }, 403);
  const users = db.prepare("SELECT id, login_id, name, role, active, must_change_password, created_at FROM users").all();
  return c.json({ users });
});

auth.post("/users/:id/reset-password", async (c) => {
  const user = c.get("user") as any;
  if (user.role !== "ADMIN") return c.json({ error: "Forbidden" }, 403);
  const { id } = c.req.param();
  const temp = "SNC" + Math.random().toString(36).slice(2, 8).toUpperCase();
  db.prepare("UPDATE users SET password_hash=?, must_change_password=1, updated_at=? WHERE id=?"
  ).run(hashSync(temp, 10), now(), id);
  audit("PASSWORD_RESET", user.id, `Reset password for user: ${id}`);
  return c.json({ ok: true, tempPassword: temp });
});

auth.delete("/users/:id", async (c) => {
  const user = c.get("user") as any;
  if (user.role !== "ADMIN") return c.json({ error: "Forbidden" }, 403);
  const { id } = c.req.param();
  if (id === user.id) return c.json({ error: "Cannot delete yourself" }, 400);
  db.prepare("UPDATE users SET active=0, updated_at=? WHERE id=?").run(now(), id);
  audit("USER_DELETED", user.id, `Deleted user: ${id}`);
  return c.json({ ok: true });
});

export default auth;
