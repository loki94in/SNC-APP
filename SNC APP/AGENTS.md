# SNC APP — Project Agents Memory

## Project Identity
**Name:** SNC Patient Register (Siyaram Neurotherapy Center, Agra)
**Type:** Full-stack clinic management web app (React frontend + Bun/Hono API backend + SQLite)
**Stage:** Feature-complete per ADD-1.00 addendum. Production-ready with hardening pass.

---

## Architecture

```
SNC APP/
├── backend/              # Bun + Hono API server
│   └── src/
│       ├── db.ts        # SQLite schema + seed data
│       ├── auth.ts      # JWT middleware + password hashing
│       ├── audit.ts     # Audit logging helper
│       ├── index.ts     # Main server (routes + CORS)
│       └── routes/      # auth, patients, sessions, payments, regular, roles, dashboard, telegram
├── snc/                 # React + Vite frontend (Zo Site)
│   └── src/
│       ├── App.tsx      # Router + AuthGuard + PermissionContext
│       ├── pages/      # Dashboard, Patients, Sessions, Payments, Calendar, RegularVisits
│       └── pages/admin/ # Telegram, Security, Roles, Users
├── snc-desktop/         # Electron wrapper for standalone
├── data/                # SQLite database (snc.db)
└── site/                # Built frontend output
```

## Stack
- **Runtime:** Bun (NOT Node.js)
- **Backend:** Hono framework (NOT Express)
- **Frontend:** React + Vite + Tailwind CSS 4 + shadcn/ui
- **Database:** SQLite via `bun:sqlite`
- **Auth:** JWT (HS256) in Authorization header, bcrypt password hashing
- **Telegram:** Bot token stored AES-encrypted in DB (stored by telegram.ts helper)
- **State:** React Context (AuthContext, PermissionContext) — no Redux

## Key Decisions
- All DB writes go through API routes (no direct client access)
- Telegram token stored encrypted, decrypted in-memory only at call time
- Permissions enforced on BOTH frontend (canView/canEdit hooks) and backend (role checks)
- Sessions auto-increment per patient
- Regular visit plans can have optional day-of-week constraints
- Audit log captures: LOGIN_SUCCESS/FAILED, SESSION_CRUD, PASSWORD_CHANGED/RESET, TELEGRAM events

## Security Model
1. **Read-only by default** — all API routes require Authorization header
2. **Role-based access** — ADMIN > CLINICIAN > RECEPTIONIST > FINANCE
3. **Permission matrix** — per-screen EDIT/VIEW/HIDDEN per role (stored in `permissions` table)
4. **Password policy** — min 8 chars, 1 digit, 1 special char; temp passwords shown once only
5. **Audit trail** — all sensitive operations logged with user + timestamp
6. **Token encryption** — Telegram bot token AES-256-GCM encrypted at rest (key from TELEGRAM_TOKEN_KEY env var, fallback to JWT_SECRET-derived key)
7. **Session invalidation** — password change forces re-login for all sessions
8. **Rate limiting** — 5 login attempts/min per IP on `/api/auth/login`, 60 req/min on other auth routes (in-memory sliding window, see `auth.ts:rateLimit()`)
9. **Security headers** — X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy on all responses
10. **Body size limits** — 512KB max request body on API routes
11. **CORS** — origin restricted to ALLOWED_ORIGINS env var; falls back to allow-all in dev or when env var is empty

## Backend Service
- The production backend runs from `/__substrate/space/` (processes 4907, 4919 via tsx)
- Frontend proxy server runs from `/home/snc-frontend/` (process 215 via bun)
- API proxy: frontend server forwards `/api/*` to `http://localhost:3000`
- Backend serves index.html from `/home/workspace/SNC APP/site/index.html`

## Environment Variables (Production)
| Var | Purpose |
|-----|---------|
| JWT_SECRET | JWT signing key (REQUIRED in production) |
| TELEGRAM_TOKEN_KEY | AES-256-GCM key for Telegram bot token encryption |
| ALLOWED_ORIGINS | Comma-separated CORS-allowed origins |
| SNC_BACKEND_PORT | Backend port (default 3000) |

## AI Workflow (per DEVELOPMENT.md)
- Human-in-the-loop at every write: generate → review → security scan → human approve
- Never blind-accept AI output
- Sandbox testing before deploy
- Memory: store project goals + architecture + reusable components in this file

## Current Feature Status (ADD-1.00 + Phase 13)
| Module | Status |
|--------|--------|
| Module A — Telegram Bot Manager | ✅ Implemented |
| Module B — Credential & Password Manager | ✅ Implemented |
| Module C — Role & Privilege Manager | ✅ Implemented |
| Module D — Session Notes (PRE/POST) | ✅ Implemented |
| Module E — Regular Visit Tracker | ✅ Implemented |
| Permission matrix runtime enforcement | ✅ Implemented |
| Audit logging | ✅ Implemented |
| Performance DB indexes | ✅ Added (Phase 13) |
| Backup / Restore API + UI | ✅ Added (Phase 13) |

## Tech Debt / Known Issues
- Sessions edit modal does NOT include pre/post sections (only basic fields) — design choice per current UX
- Regular visit calendar is list view, not full month-grid calendar (would need date-fns + calendar UI)
- Telegram push commands endpoint requires valid bot token — no graceful fallback UI
- No backup/restore feature yet (alert system exists but no scheduled backup)
- Backend hardcoded JWT_SECRET — set via env var in production

## Phase 13 Backlog (Post-Launch Improvements)
- Backup/restore feature (scheduled backup to file/cloud)
- Full calendar month-grid view for regular visits
- WhatsApp bot manager (mirror of Telegram Module A)
- Patient history timeline view
- Bulk import patients from CSV
- Session PDF export with print layout
- Analytics dashboard (revenue trends, patient retention)
- SMS alert module (mirror of Telegram alerts)
- Multi-clinic support (branch management)