import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

// CORS for API routes if needed
app.use("*", cors());

// API Routes
app.get("/api/health", (c) => c.json({ status: "ok", time: new Date().toISOString() }));

// SPA fallback - serve index.html for all non-API routes
app.get("*", async (c) => {
  const path = c.req.path;
  
  // Serve static files from public
  const publicFile = Bun.file(`./public${path}`);
  if (await publicFile.exists()) {
    const stat = await publicFile.stat();
    if (stat && !stat.isDirectory()) {
      return new Response(publicFile, {
        headers: { "Content-Type": getContentType(path) },
      });
    }
  }
  
  // In dev mode, try dist for built assets
  if (process.env.NODE_ENV === "production") {
    const distFile = Bun.file(`./dist${path}`);
    if (await distFile.exists()) {
      const stat = await distFile.stat();
      if (stat && !stat.isDirectory()) {
        return new Response(distFile, {
          headers: { "Content-Type": getContentType(path) },
        });
      }
    }
  }
  
  // Serve index.html (SPA routing)
  const index = Bun.file("./index.html");
  return new Response(index, {
    headers: { "Content-Type": "text/html" },
  });
});

function getContentType(path: string): string {
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".js")) return "application/javascript";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg")) return "image/jpeg";
  return "text/html";
}

const port = process.env.PORT ? parseInt(process.env.PORT) : 50826;

// Export for Zo Computer deployment system
export default {
  fetch: app.fetch,
  port,
  idleTimeout: 255,
};