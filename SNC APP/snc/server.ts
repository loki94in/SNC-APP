import { Hono } from "hono";

const app = new Hono();

// SPA-style routing: all GET requests serve index.html
app.get("*", async (c) => {
  const path = c.req.path;
  
  // Try to serve from public directory
  const publicFile = Bun.file(`./public${path}`);
  if (await publicFile.exists()) {
    const stat = await publicFile.stat();
    if (stat && !stat.isDirectory()) {
      return new Response(publicFile, {
        headers: { "Content-Type": getContentType(path) },
      });
    }
  }
  
  // Serve index.html for all other paths (SPA routing)
  const index = Bun.file("./index.html");
  return new Response(index, {
    headers: { "Content-Type": "text/html" },
  });
});

function getContentType(path) {
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".js")) return "application/javascript";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg")) return "image/jpeg";
  return "text/html";
}

const port = process.env.PORT ? parseInt(process.env.PORT) : 50826;

export default { fetch: app.fetch, port, idleTimeout: 255 };