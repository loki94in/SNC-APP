// Serves the patched frontend HTML at GET /
import { Hono } from "hono";
import { cors } from "hono/cors";
import { resolve } from "path";

const frontend = new Hono();

frontend.use("/*", cors());

// Read the frontend HTML once at startup
let frontendHtml = "";
try {
    const path = resolve(import.meta.dirname, "../../site/index.html");
    frontendHtml = await Bun.file(path).text();
    console.log(`Frontend HTML loaded: ${frontendHtml.length} chars`);
} catch (e) {
    console.error("Failed to load frontend HTML:", e);
}

// Serve frontend at root
frontend.get("/", (c) => {
    if (!frontendHtml) {
        return c.html("<h1>Frontend not found</h1>", 500);
    }
    return new Response(frontendHtml, {
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache",
        },
    });
});

export default frontend;
