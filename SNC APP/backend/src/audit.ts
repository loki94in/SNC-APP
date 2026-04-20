import { db } from "./db.js";
import { v4 as uid } from "uuid";

async function sendTg(text: string) {
  try {
    const { sendTelegramMessage } = await import("./telegram.js");
    sendTelegramMessage(text);
  } catch {
    // Telegram not configured or unavailable — silently skip
  }
}

export function audit(
  event: string,
  userId: string,
  details?: string,
  ip?: string,
) {
  const id = uid();
  const ts = new Date().toISOString();
  db.prepare(
    `INSERT INTO audit_log (id, event, user_id, details, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, event, userId || null, details || null, ip || null, ts);

  // Fire Telegram alerts for meaningful admin events
  if (event === "LOGIN_SUCCESS" || event === "LOGIN_FAILED") {
    const actor = userId ? db.prepare("SELECT name FROM users WHERE id = ?").get(userId) as any : null;
    const name = actor?.name || details || event;
    sendTg(
      `<b>${event === "LOGIN_SUCCESS" ? "✅ Login" : "⚠️ Failed Login"}</b>\n` +
      `User: <code>${name}</code>\n` +
      `Time: ${ts.replace("T", " ").slice(0, 19)}`
    );
  }
  if (event === "USER_CREATED" || event === "USER_DELETED" || event === "PASSWORD_RESET") {
    sendTg(
      `<b>${event}</b>\n` +
      `By: ${userId}\n` +
      `${details ? "Details: " + details : ""}`
    );
  }
  if (event === "TELEGRAM_TOKEN_SAVED" || event === "TELEGRAM_TOKEN_REVOKED") {
    sendTg(
      `<b>Telegram Config Change</b>\n` +
      `Event: ${event}\n` +
      `${details || ""}`
    );
  }
}
