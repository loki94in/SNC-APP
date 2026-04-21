import type { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { db } from "./db.js";

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
// Simple in-memory sliding-window rate limiter (per-IP)
// Returns true if request is allowed, false if blocked.
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

export function rateLimit(options: { windowMs: number; maxRequests: number; keyPrefix?: string }): (c: Context, next: Next) => Promise<Response | void> {
  const { windowMs, maxRequests, keyPrefix = "rl" } = options;
  return async (c: Context, next: Next) => {
    const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim()
             ?? c.req.header("cf-connecting-ip")
             ?? "unknown";
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    const entry = rateLimitMap.get(key);
    if (!entry || now - entry.windowStart > windowMs) {
      rateLimitMap.set(key, { count: 1, windowStart: now });
    } else {
      entry.count++;
      if (entry.count > maxRequests) {
        const retryAfter = Math.ceil((windowMs - (now - entry.windowStart)) / 1000);
        return c.json({ error: "Too many requests. Please try again later.", retryAfter }, 429);
      }
      rateLimitMap.set(key, entry);
    }
    // Clean up stale entries every 100 requests
    if (rateLimitMap.size > 1000) {
      const cutoff = now - windowMs * 2;
      for (const [k, v] of rateLimitMap) {
        if (now - v.windowStart > cutoff) rateLimitMap.delete(k);
      }
    }
    await next();
  };
}

// ─── Body Size Limiter ─────────────────────────────────────────────────────────
// Prevents large payload DoS — enforce max body size per route type
export function bodySizeLimit(maxBytes: number) {
  return async (c: Context, next: Next) => {
    const contentLength = c.req.header("content-length");
    if (contentLength && parseInt(contentLength) > maxBytes) {
      return c.json({ error: "Request body too large" }, 413);
    }
    await next();
  };
}

// ─── Input Sanitizer ─────────────────────────────────────────────────────────
// Strips control characters that are never valid in text fields
export function sanitizeString(str: unknown): string {
  if (typeof str !== "string") return "";
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

// ─── JWT Secret Check ────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || "snc-secret-key-change-in-production";
if (!process.env.JWT_SECRET) {
  console.warn("[SECURITY] JWT_SECRET not set — using insecure fallback. Set process.env.JWT_SECRET in production!");
}

export interface AuthUser {
  id: string; login_id: string; name: string; role: string;
}

export async function authMiddleware(c: Context, next: Next) {
  // Skip auth middleware for login/logout endpoints
  const path = c.req.path;
  if (path === "/api/auth/login" || path === "/api/auth/logout") {
    await next();
    return;
  }
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) return c.json({ error: "Unauthorized" }, 401);
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
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
