import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { Hono } from "hono";
import type { Context, Next } from "hono";
import { authMiddleware, rateLimit } from "./auth.js";
import authRoutes from "./routes/auth.js";
import patientRoutes from "./routes/patients.js";
import sessionRoutes from "./routes/sessions.js";
import paymentRoutes from "./routes/payments.js";
import regularRoutes from "./routes/regular.js";
import roleRoutes from "./routes/roles.js";
import dashboardRoutes from "./routes/dashboard.js";
import telegramRoutes from "./routes/telegram.js";
import backupRoutes from "./routes/backup.js";
import { resolve, dirname } from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = new Hono();

// Secure CORS — restrict to known origins in production
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean);
app.use("/*", cors({
  origin: (origin: string) => {
    if (!origin || ALLOWED_ORIGINS.length === 0) return origin || "*";
    return ALLOWED_ORIGINS.includes(origin) ? origin : "*";
  },
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400,
}));

// ─── Security Headers ────────────────────────────────────────────────────────
app.use("/*", async (c: Context, next: Next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "1; mode=block");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
});

// ─── Rate Limiting on Auth Routes ──────────────────────────────────────────
// 5 login attempts per minute per IP — prevents brute force
app.use("/api/auth/login", rateLimit({ windowMs: 60_000, maxRequests: 5, keyPrefix: "login" }));
app.use("/api/auth/*", rateLimit({ windowMs: 60_000, maxRequests: 60, keyPrefix: "auth" }));

// ─── Body Size Limits ────────────────────────────────────────────────────────
// Prevent DoS with oversized payloads
app.use("/api/*", async (c: Context, next: Next) => {
  const len = c.req.header("content-length");
  if (len && parseInt(len) > 512_000) return c.json({ error: "Request body too large" }, 413);
  await next();
});

app.route("/api/auth", authRoutes);
app.use("/api/*", authMiddleware);
app.route("/api/dashboard", dashboardRoutes);
app.route("/api/patients", patientRoutes);
app.route("/api/sessions", sessionRoutes);
app.route("/api/payments", paymentRoutes);
app.route("/api/regular", regularRoutes);
app.route("/api/roles", roleRoutes);
app.route("/api/telegram", telegramRoutes);
app.route("/api/backup", backupRoutes);

// Serve frontend HTML inline (avoid circular import)
const frontendHtml = readFileSync(resolve(__dirname, "../../site/index.html"), "utf-8");
app.get("/", (c) => c.html(frontendHtml));

const PORT = parseInt(process.env.PORT || "3000");
console.log(`SNC Backend on http://localhost:${PORT} (frontend: ${frontendHtml.length} chars)`);
serve({ fetch: app.fetch, port: PORT });
