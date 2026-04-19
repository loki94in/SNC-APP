import { Database } from "bun:sqlite";
import { hashSync } from "bcryptjs";
import { v4 as uid } from "uuid";
import { resolve } from "path";

// Use relative path for cross-platform compatibility
const DB_PATH = resolve(import.meta.dir, "snc.db");
export const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, login_id TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
    name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'RECEPTIONIST',
    active INTEGER NOT NULL DEFAULT 1, must_change_password INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY, reg_no TEXT UNIQUE, name TEXT NOT NULL,
    age TEXT, sex TEXT, occupation TEXT, address TEXT, mobile TEXT NOT NULL, telephone TEXT,
    conditions TEXT, restrictions TEXT, history TEXT,
    active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY, patient_id TEXT NOT NULL, session_no INTEGER NOT NULL, date TEXT NOT NULL,
    visit_type TEXT NOT NULL DEFAULT 'IN-CLINIC', clinician_id TEXT, clinician_name TEXT,
    duration INTEGER, payment REAL DEFAULT 0, payment_mode TEXT DEFAULT 'CASH',
    pre_complaint TEXT, pre_pain INTEGER, pre_mobility TEXT, pre_vitals TEXT, pre_notes TEXT,
    post_techniques TEXT, post_pain INTEGER, post_response TEXT, post_notes TEXT,
    post_recommendation TEXT, followup TEXT,
    created_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY, patient_id TEXT NOT NULL, session_id TEXT, amount REAL NOT NULL,
    mode TEXT NOT NULL, notes TEXT, recorded_by TEXT, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS regular_plans (
    id TEXT PRIMARY KEY, patient_id TEXT NOT NULL, frequency TEXT NOT NULL, days TEXT,
    protocol TEXT, start_date TEXT, end_date TEXT, target_count INTEGER,
    active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS regular_visits (
    id TEXT PRIMARY KEY, plan_id TEXT NOT NULL, patient_id TEXT NOT NULL, visit_date TEXT NOT NULL,
    attended INTEGER NOT NULL DEFAULT 0, absence_reason TEXT, treatment TEXT,
    clinician_id TEXT, duration INTEGER, notes TEXT, session_id TEXT,
    payment REAL, payment_mode TEXT, condition_status TEXT, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY, role TEXT NOT NULL, screen TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'HIDDEN'
  );
  CREATE TABLE IF NOT EXISTS telegram_config (
    id TEXT PRIMARY KEY, bot_token_enc TEXT, chat_id TEXT,
    alert_backup INTEGER NOT NULL DEFAULT 1, alert_login_fail INTEGER NOT NULL DEFAULT 1,
    alert_time TEXT NOT NULL DEFAULT '20:00', status TEXT NOT NULL DEFAULT 'NOT_SET',
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS telegram_commands (
    id TEXT PRIMARY KEY, trigger TEXT NOT NULL, description TEXT NOT NULL,
    response_type TEXT NOT NULL DEFAULT 'STATIC_TEXT', response_text TEXT,
    data_query TEXT, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY, event TEXT NOT NULL, user_id TEXT, details TEXT,
    ip_address TEXT, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS backup_log (
    id TEXT PRIMARY KEY, status TEXT NOT NULL, file_path TEXT, size_bytes INTEGER,
    error_message TEXT, created_at TEXT NOT NULL
  );
`);

// Seed default permissions
const defaultPerms = [
  ["ADMIN","dashboard","EDIT"],["ADMIN","patients","EDIT"],["ADMIN","patient-detail","EDIT"],
  ["ADMIN","sessions","EDIT"],["ADMIN","regular-visits","EDIT"],["ADMIN","payments","EDIT"],
  ["ADMIN","calendar","EDIT"],["ADMIN","admin-users","EDIT"],["ADMIN","admin-roles","EDIT"],
  ["ADMIN","admin-telegram","EDIT"],["ADMIN","admin-security","EDIT"],
  ["CLINICIAN","dashboard","VIEW"],["CLINICIAN","patients","EDIT"],["CLINICIAN","patient-detail","EDIT"],
  ["CLINICIAN","sessions","EDIT"],["CLINICIAN","regular-visits","EDIT"],["CLINICIAN","calendar","EDIT"],
  ["RECEPTIONIST","dashboard","VIEW"],["RECEPTIONIST","patients","EDIT"],
  ["RECEPTIONIST","patient-detail","VIEW"],["RECEPTIONIST","calendar","EDIT"],
  ["FINANCE","dashboard","VIEW"],["FINANCE","payments","EDIT"],
];
const insertPerm = db.prepare("INSERT OR IGNORE INTO permissions (id, role, screen, level) VALUES ($1, $2, $3, $4)");
for (const [role, screen, level] of defaultPerms) insertPerm.run(uid(), role, screen, level);

// Seed default admin
const adminExists = db.prepare("SELECT id FROM users WHERE login_id = $1").get("admin");
if (!adminExists) {
  db.prepare(`INSERT INTO users (id, login_id, password_hash, name, role, active, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
  ).run(uid(), "admin", hashSync("admin123"), "System Admin", "ADMIN", 1,
    new Date().toISOString(), new Date().toISOString());
}

export function now() { return new Date().toISOString(); }
