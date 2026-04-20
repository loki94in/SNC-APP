import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { Hono } from "hono";
import { authMiddleware } from "./auth.js";
import authRoutes from "./routes/auth.js";
import patientRoutes from "./routes/patients.js";
import sessionRoutes from "./routes/sessions.js";
import paymentRoutes from "./routes/payments.js";
import regularRoutes from "./routes/regular.js";
import roleRoutes from "./routes/roles.js";
import dashboardRoutes from "./routes/dashboard.js";
import telegramRoutes from "./routes/telegram.js";
import { resolve, dirname } from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = new Hono();

app.use("/*", cors({ origin: "*", allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], allowHeaders: ["Content-Type", "Authorization"] }));

app.route("/api/auth", authRoutes);
app.use("/api/*", authMiddleware);
app.route("/api/dashboard", dashboardRoutes);
app.route("/api/patients", patientRoutes);
app.route("/api/sessions", sessionRoutes);
app.route("/api/payments", paymentRoutes);
app.route("/api/regular", regularRoutes);
app.route("/api/roles", roleRoutes);
app.route("/api/telegram", telegramRoutes);

// Serve frontend HTML inline (avoid circular import)
const frontendHtml = readFileSync(resolve(__dirname, "../../site/index.html"), "utf-8");
app.get("/", (c) => c.html(frontendHtml));

const PORT = parseInt(process.env.PORT || "3000");
console.log(`SNC Backend on http://localhost:${PORT} (frontend: ${frontendHtml.length} chars)`);
serve({ fetch: app.fetch, port: PORT });
