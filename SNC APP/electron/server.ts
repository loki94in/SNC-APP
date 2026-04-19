import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

// Enable CORS for all routes
app.use("/*", cors());

// Read the HTML file
const html = await Bun.file("/home/workspace/SNC APP/snc_dev_decoded.html").text();

// SPA-style: serve the HTML for all GET routes
app.get("*", async (c) => {
  return c.html(html, 200, {
    "Content-Type": "text/html; charset=utf-8",
  });
});

// POST endpoints for Telegram bot integration (Module A)
app.post("/api/telegram/webhook", async (c) => {
  const body = await c.req.json();
  // Handle Telegram webhook - just acknowledge for now
  return c.json({ ok: true });
});

const PORT = 3000;
console.log(`SNC App starting on http://localhost:${PORT}`);
export default { fetch: app.fetch, port: PORT };
