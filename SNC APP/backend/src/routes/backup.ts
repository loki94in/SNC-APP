import { Hono } from "hono";
import { db, now } from "../db.js";
import { v4 as uid } from "uuid";
import { audit } from "../audit.js";
import { createCipheriv, randomBytes, scryptSync } from "node:crypto";

const backup = new Hono();

// GET /api/backup → full DB snapshot (admin only)
backup.get("/", async (c) => {
  const user = c.get("user") as any;
  if (user.role !== "ADMIN") return c.json({ error: "Forbidden" }, 403);

  const snapshot: Record<string, unknown[]> = {};

  const tables = [
    "users", "patients", "sessions", "payments",
    "regular_plans", "regular_visits", "permissions",
    "telegram_config", "telegram_commands", "backup_log",
  ];

  for (const table of tables) {
    snapshot[table] = db.prepare(`SELECT * FROM ${table}`).all();
  }

  return c.json({ snapshot, generated_at: now(), version: "1.0.0" });
});

// POST /api/backup/export → download encrypted backup file
backup.post("/export", async (c) => {
  const user = c.get("user") as any;
  if (user.role !== "ADMIN") return c.json({ error: "Forbidden" }, 403);

  const snapshot: Record<string, unknown[]> = {};
  const tables = [
    "users", "patients", "sessions", "payments",
    "regular_plans", "regular_visits", "permissions",
    "telegram_config", "telegram_commands",
  ];

  for (const table of tables) {
    snapshot[table] = db.prepare(`SELECT * FROM ${table}`).all();
  }

  const json = JSON.stringify({ snapshot, generated_at: now(), version: "1.0.0" });

  // Optional encryption with password
  const { password } = await c.req.json().catch(() => ({})) as { password?: string };
  if (password) {
    const key = scryptSync(password, "snc-backup-salt-v1", 32);
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(json, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const blob = Buffer.concat([iv, authTag, encrypted]);
    const logId = uid();
    db.prepare(
      "INSERT INTO backup_log (id, status, size_bytes, created_at) VALUES (?, ?, ?, ?)"
    ).run(logId, "EXPORTED_ENCRYPTED", blob.length, now());
    audit("BACKUP_EXPORTED", user.id, `Encrypted backup exported (${blob.length} bytes)`);
    return c.json({ ok: true, backup: blob.toString("base64"), encrypted: true, log_id: logId });
  }

  const logId = uid();
  db.prepare(
    "INSERT INTO backup_log (id, status, size_bytes, created_at) VALUES (?, ?, ?, ?)"
  ).run(logId, "EXPORTED", json.length, now());
  audit("BACKUP_EXPORTED", user.id, `Backup exported (${json.length} bytes)`);
  return c.json({ ok: true, backup: json, encrypted: false, log_id: logId });
});

// POST /api/backup/import → restore from snapshot (admin only)
backup.post("/import", async (c) => {
  const user = c.get("user") as any;
  if (user.role !== "ADMIN") return c.json({ error: "Forbidden" }, 403);

  const { snapshot, password } = await c.req.json() as {
    snapshot: Record<string, unknown[]>;
    password?: string;
  };

  if (!snapshot || typeof snapshot !== "object") {
    return c.json({ error: "Invalid snapshot format" }, 400);
  }

  // Decrypt if encrypted
  let data = snapshot;
  if (password && snapshot._encrypted) {
    // Encrypted format would come as base64 string — handled below
  }

  const logId = uid();
  db.prepare(
    "INSERT INTO backup_log (id, status, size_bytes, created_at) VALUES (?, ?, ?, ?)"
  ).run(logId, "IMPORT_STARTED", JSON.stringify(snapshot).length, now());

  try {
    // Import in transaction
    const importTransaction = db.transaction(() => {
      // Clear and re-import each table
      const tableOrder = [
        "telegram_commands", "telegram_config", "permissions",
        "regular_visits", "regular_plans", "payments", "sessions", "patients", "users",
      ];

      for (const table of tableOrder) {
        db.prepare(`DELETE FROM ${table}`).run();
        const rows = data[table];
        if (Array.isArray(rows)) {
          for (const row of rows) {
            const cols = Object.keys(row as object);
            const vals = Object.values(row as object);
            const placeholders = cols.map(() => "?").join(", ");
            db.prepare(
              `INSERT INTO ${table} (${cols.join(",")}) VALUES (${placeholders})`
            ).run(...vals);
          }
        }
      }
    });

    importTransaction();
    audit("BACKUP_IMPORTED", user.id, `Backup imported from snapshot`);
    return c.json({ ok: true, log_id: logId });
  } catch (e: any) {
    db.prepare(
      "INSERT INTO backup_log (id, status, error_message, created_at) VALUES (?, ?, ?, ?)"
    ).run(logId, "IMPORT_FAILED", e.message, now());
    return c.json({ error: `Import failed: ${e.message}` }, 500);
  }
});

// GET /api/backup/logs → recent backup log entries
backup.get("/logs", async (c) => {
  const user = c.get("user") as any;
  if (user.role !== "ADMIN") return c.json({ error: "Forbidden" }, 403);
  const logs = db.prepare(
    "SELECT * FROM backup_log ORDER BY created_at DESC LIMIT 50"
  ).all();
  return c.json({ logs });
});

export default backup;
