import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { db } from "./db.js";
import { v4 as uid } from "uuid";

// ─── Token Encryption (AES-256-GCM) ──────────────────────────────────────────
// Telegram bot token is encrypted at rest using AES-256-GCM with auth tag.
// Key derived from TELEGRAM_TOKEN_KEY env var + a static server salt.
// Decrypted only in-memory when needed for API calls.

if (!process.env.TELEGRAM_TOKEN_KEY) {
  console.warn("[SECURITY] TELEGRAM_TOKEN_KEY not set — using fallback. Set TELEGRAM_TOKEN_KEY env var for production!");
}

function getEncryptionKey(): Buffer {
  const envKey = process.env.TELEGRAM_TOKEN_KEY || "";
  if (envKey) return scryptSync(envKey, "snc-tg-salt-v1", 32);
  // Fallback: deterministic but weak — only for dev if env var not set
  return scryptSync(process.env.JWT_SECRET || "snc-dev-key", "snc-tg-salt-v1", 32);
}

function encryptToken(plainToken: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainToken, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptToken(encryptedToken: string): string {
  const key = getEncryptionKey();
  const raw = Buffer.from(encryptedToken, "base64");
  const iv = raw.subarray(0, 16);
  const authTag = raw.subarray(16, 32);
  const ciphertext = raw.subarray(32);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

// ─── Config Helpers ──────────────────────────────────────────────────────────

export function getTelegramConfig() {
  return db.prepare("SELECT * FROM telegram_config LIMIT 1").get();
}

export function saveTelegramToken(token: string, chatId?: string) {
  const config = getTelegramConfig() as any;
  const n = new Date().toISOString();
  const encrypted = encryptToken(token);
  if (config) {
    db.prepare("UPDATE telegram_config SET bot_token_enc=?, chat_id=?, status='ACTIVE', updated_at=? WHERE id=?"
    ).run(encrypted, chatId||null, n, config.id);
  } else {
    db.prepare("INSERT INTO telegram_config (id, bot_token_enc, chat_id, status, updated_at) VALUES (?, ?, ?, 'ACTIVE', ?)"
    ).run(uid(), encrypted, chatId||null, n);
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
    const token = decryptToken(config.bot_token_enc);
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: config.chat_id, text, parse_mode: "HTML" }),
    });
    return true;
  } catch { return false; }
}
