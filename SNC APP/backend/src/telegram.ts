import { db } from "./db.js";
import { v4 as uid } from "uuid";

export function getTelegramConfig() {
  return db.prepare("SELECT * FROM telegram_config LIMIT 1").get();
}

export function saveTelegramToken(token: string, chatId?: string) {
  const config = getTelegramConfig() as any;
  const n = new Date().toISOString();
  if (config) {
    db.prepare("UPDATE telegram_config SET bot_token_enc=?, chat_id=?, status='ACTIVE', updated_at=? WHERE id=?"
    ).run(token, chatId||null, n, config.id);
  } else {
    db.prepare("INSERT INTO telegram_config (id, bot_token_enc, chat_id, status, updated_at) VALUES (?, ?, ?, 'ACTIVE', ?)"
    ).run(uid(), token, chatId||null, n);
  }
}

export function revokeTelegramToken() {
  const config = getTelegramConfig() as any;
  if (config) db.prepare("UPDATE telegram_config SET bot_token_enc=NULL, chat_id=NULL, status='REVOKED', updated_at=? WHERE id=?"
  ).run(new Date().toISOString(), config.id);
}

export async function testTelegramConnection(token: string): Promise<{ok: boolean; bot?: string}> {
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const d = await r.json();
    return d.ok ? { ok: true, bot: (d.result as any).username } : { ok: false };
  } catch { return { ok: false }; }
}

export function sendTelegramMessage(text: string): boolean {
  const config = getTelegramConfig() as any;
  if (!config?.bot_token_enc || !config?.chat_id) return false;
  try {
    fetch(`https://api.telegram.org/bot${config.bot_token_enc}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: config.chat_id, text, parse_mode: "HTML" }),
    });
    return true;
  } catch { return false; }
}
