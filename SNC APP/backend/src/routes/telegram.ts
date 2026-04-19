import { Hono } from "hono";
import { db, now } from "../db.js";
import { v4 as uid } from "uuid";
import { audit } from "../audit.js";
import { getTelegramConfig, saveTelegramToken, revokeTelegramToken, testTelegramConnection } from "../telegram.js";
const tg = new Hono();

tg.get("/config", async (c) => {
  const config = getTelegramConfig() as any;
  return c.json({ config: config ? { status: config.status, chat_id: config.chat_id, alert_backup: config.alert_backup, alert_login_fail: config.alert_login_fail, alert_time: config.alert_time } : null });
});

tg.post("/token", async (c) => {
  const user = c.get("user") as any;
  if (user.role !== "ADMIN") return c.json({ error: "Forbidden" }, 403);
  const { token, chatId } = await c.req.json();
  const test = await testTelegramConnection(token);
  if (!test.ok) return c.json({ error: "Could not verify token with Telegram" }, 400);
  saveTelegramToken(token, chatId);
  audit("TELEGRAM_TOKEN_SAVED", user.id, `Telegram bot token saved: @${test.bot}`);
  return c.json({ ok: true, bot: test.bot });
});

tg.post("/revoke", async (c) => {
  const user = c.get("user") as any;
  if (user.role !== "ADMIN") return c.json({ error: "Forbidden" }, 403);
  revokeTelegramToken();
  audit("TELEGRAM_TOKEN_REVOKED", user.id);
  return c.json({ ok: true });
});

tg.post("/test", async (c) => {
  const { token } = await c.req.json();
  return c.json(await testTelegramConnection(token));
});

tg.get("/commands", async (c) => {
  return c.json({ commands: db.prepare("SELECT * FROM telegram_commands ORDER BY trigger").all() });
});

tg.post("/commands", async (c) => {
  const user = c.get("user") as any;
  if (user.role !== "ADMIN") return c.json({ error: "Forbidden" }, 403);
  const { commands } = await c.req.json();
  db.prepare("DELETE FROM telegram_commands").run();
  for (const cmd of commands) {
    if (!cmd.trigger) continue;
    db.prepare("INSERT INTO telegram_commands (id,trigger,description,response_type,response_text,data_query,is_active,created_at) VALUES (?,?,?,?,?,?,?,?)").run(
      uid(), cmd.trigger, cmd.description||"", cmd.responseType||"STATIC_TEXT", cmd.responseText||"", cmd.dataQuery||"", cmd.isActive?1:0, now()
    );
  }
  audit("TELEGRAM_COMMANDS_UPDATED", user.id, `Updated Telegram commands`);
  return c.json({ ok: true });
});

tg.post("/commands/push", async (c) => {
  const user = c.get("user") as any;
  if (user.role !== "ADMIN") return c.json({ error: "Forbidden" }, 403);
  const cmds = db.prepare("SELECT * FROM telegram_commands WHERE is_active=1").all() as any[];
  const config = getTelegramConfig() as any;
  if (!config?.bot_token_enc) return c.json({ error: "No bot token configured" }, 400);
  try {
    const tgCmds = cmds.map((cmd: any) => ({ command: cmd.trigger, description: cmd.description }));
    await fetch(`https://api.telegram.org/bot${config.bot_token_enc}/setMyCommands`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commands: tgCmds }),
    });
    audit("TELEGRAM_COMMANDS_PUSHED", user.id);
    return c.json({ ok: true });
  } catch (e: any) { return c.json({ error: e.message }, 500); }
});

export default tg;
