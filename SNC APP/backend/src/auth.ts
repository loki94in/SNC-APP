import type { Context, Next } from "hono";
import { verify } from "jsonwebtoken";
import { db } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "snc-secret-key-change-in-production";

export interface AuthUser {
  id: string; login_id: string; name: string; role: string;
}

export async function authMiddleware(c: Context, next: Next) {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) return c.json({ error: "Unauthorized" }, 401);
  const token = header.slice(7);
  try {
    const payload = verify(token, JWT_SECRET) as AuthUser;
    const user = db.prepare("SELECT * FROM users WHERE id = ? AND active = 1").get(payload.id) as any;
    if (!user) return c.json({ error: "User not found or inactive" }, 401);
    c.set("user", user);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
}

export function checkPermission(role: string, screen: string): string {
  const row = db.prepare("SELECT level FROM permissions WHERE role = ? AND screen = ?").get(role, screen) as { level: string } | undefined;
  return row?.level || "HIDDEN";
}

export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user") as AuthUser;
    if (!roles.includes(user.role)) return c.json({ error: "Forbidden" }, 403);
    await next();
  };
}
