import Database from "better-sqlite3";
import pkg from "bcryptjs";
import { v4 as uid } from "uuid";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

// Resolve DB path relative to this file's directory
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../data");
mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = resolve(DATA_DIR, "snc.db");

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

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
    payment REAL, payment_mode TEXT, condition_status TEXT DEFAULT 'NOT_ASSESSED', updated_at TEXT,
    created_at TEXT NOT NULL
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

// ─── Performance Indexes ────────────────────────────────────────────────────
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_sessions_patient ON sessions(patient_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
  CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(active);
  CREATE INDEX IF NOT EXISTS idx_patients_mobile ON patients(mobile);
  CREATE INDEX IF NOT EXISTS idx_payments_patient ON payments(patient_id);
  CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at);
  CREATE INDEX IF NOT EXISTS idx_regular_plans_patient ON regular_plans(patient_id);
  CREATE INDEX IF NOT EXISTS idx_regular_plans_active ON regular_plans(active);
  CREATE INDEX IF NOT EXISTS idx_regular_visits_plan ON regular_visits(plan_id);
  CREATE INDEX IF NOT EXISTS idx_regular_visits_date ON regular_visits(visit_date);
  CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_event ON audit_log(event);
  CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
  CREATE INDEX IF NOT EXISTS idx_users_login ON users(login_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_perms_role_screen ON permissions(role, screen);
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
const insertPerm = db.prepare("INSERT OR IGNORE INTO permissions (id, role, screen, level) VALUES (?, ?, ?, ?)");
for (const [role, screen, level] of defaultPerms) insertPerm.run(uid(), role, screen, level);

// Seed default admin
const adminExists = db.prepare("SELECT id FROM users WHERE login_id = ?").get("admin");
if (!adminExists) {
  db.prepare(`INSERT INTO users (id, login_id, password_hash, name, role, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(uid(), "admin", pkg.hashSync("admin123"), "System Admin", "ADMIN", 1,
    new Date().toISOString(), new Date().toISOString());
}

export function now() { return new Date().toISOString(); }
