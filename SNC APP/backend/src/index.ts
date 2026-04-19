import { serve } from "bun";
import { cors } from "hono/cors";
import { Hono } from "hono";
import { authMiddleware } from "./auth.js";
import authRoutes from "./routes/auth.js";
import patientRoutes from "./routes/patients.js";
import sessionRoutes from "./routes/sessions.js";
import paymentRoutes from "./routes/payments.js";
import regularRoutes from "./routes/regular.js";
import telegramRoutes from "./routes/telegram.js";
import roleRoutes from "./routes/roles.js";
import dashboardRoutes from "./routes/dashboard.js";

// Initialize database
await import("./db.js");

const app = new Hono();

app.use("/*", cors({ origin: "*", credentials: true }));

// ─── Public login ──────────────────────────────────────────────
app.post("/api/auth/login", async (c) => {
  const { loginId, password } = await c.req.json();
  const { compareSync } = await import("bcryptjs");
  const { sign } = await import("jsonwebtoken");
  const { db } = await import("./db.js");
  const { audit } = await import("./audit.js");
  const JWT_SECRET = process.env.JWT_SECRET || "snc-secret-key-change-in-production";

  if (!loginId || !password) return c.json({ error: "Missing credentials" }, 400);
  const user = db.prepare("SELECT * FROM users WHERE login_id = ? AND active = 1").get(loginId) as any;
  if (!user || !compareSync(password, user.password_hash)) {
    audit("LOGIN_FAILED", null, `Failed login: ${loginId}`);
    return c.json({ error: "Invalid credentials" }, 401);
  }
  const token = sign({ id: user.id, login_id: user.login_id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
  audit("LOGIN_SUCCESS", user.id, `User logged in: ${user.login_id}`);
  return c.json({
    token,
    user: { id: user.id, login_id: user.login_id, name: user.name, role: user.role },
    mustChangePassword: !!user.must_change_password
  });
});

// ─── Protected API Routes ──────────────────────────────────────
app.use("/api/auth/*", authMiddleware);
app.use("/api/patients/*", authMiddleware);
app.use("/api/sessions/*", authMiddleware);
app.use("/api/payments/*", authMiddleware);
app.use("/api/regular/*", authMiddleware);
app.use("/api/telegram/*", authMiddleware);
app.use("/api/roles/*", authMiddleware);
app.use("/api/dashboard/*", authMiddleware);

app.route("/api/auth", authRoutes);
app.route("/api/patients", patientRoutes);
app.route("/api/sessions", sessionRoutes);
app.route("/api/payments", paymentRoutes);
app.route("/api/regular", regularRoutes);
app.route("/api/telegram", telegramRoutes);
app.route("/api/roles", roleRoutes);
app.route("/api/dashboard", dashboardRoutes);

// ─── Fallback for non-API routes (SPA frontend is served separately ──────────
app.get("*", async (c) => {
  if (!c.req.path.startsWith("/api")) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json({ error: "Route not found" }, 404);
});

const PORT = parseInt(process.env.PORT || "3000");
console.log(`SNC Backend running on http://localhost:${PORT}`);
serve({ fetch: app.fetch, port: PORT });
