import { serve } from "bun";
import { readFileSync } from "fs";

const html = readFileSync("/home/workspace/SNC APP/snc_dev_decoded.html", "utf-8");

const server = serve({
  port: 3000,
  fetch(req) {
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  },
});

console.log("SNC App running at http://localhost:" + server.port);
