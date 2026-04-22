# SNC Patient Register — Node.js/Express Version

A complete Windows desktop clinic management application for Siyaram Neurotherapy Center, Agra.

## What This Application Is

SNC Patient Register is a Windows desktop app for managing a neurotherapy clinic:
- **What it does** — Manages patients, treatment sessions, payments, and regular visit plans for a neurotherapy center
- **Who uses it** — Clinic staff (Admin, Clinician, Receptionist, Finance roles)
- **User flow** — Launch → Login → Dashboard with stats → Manage patients → Record sessions → Track payments

## Architecture

```
snc-app/
├── app.js          ← Express server (Node.js runtime)
├── database.js     ← SQLite setup (better-sqlite3)
├── package.json    ← Dependencies
├── launch.bat      ← Windows launcher (double-click to run)
├── setup.iss       ← Inno Setup installer script
├── routes/
│   ├── auth.js     ← Login, users, roles, permissions
│   ├── patients.js ← Patient CRUD
│   ├── sessions.js ← Session CRUD
│   ├── payments.js ← Payment tracking
│   ├── regular.js  ← Regular visit plans
│   ├── dashboard.js ← Stats and charts
│   ├── telegram.js ← Bot manager
│   └── roles.js    ← Permission matrix
├── public/
│   └── index.html  ← Frontend UI
├── data/           ← SQLite database (created on first run)
└── logs/           ← Server logs (created on first run)
```

## Quick Start

### Option A — Double-Click (No Setup)

1. Download and unzip the project
2. Make sure **Node.js** is installed (https://nodejs.org)
3. Double-click `launch.bat`
4. Browser opens at `http://localhost:3000`
5. Login: `admin` / `admin123`

### Option B — Manual

```powershell
# Install dependencies
npm install

# Start server
node app.js

# Open browser
http://localhost:3000
```

### Step 3 — Build Frontend (React UI)

```powershell
cd snc
npm install
npm run build
cd ..
node app.js
```

## Requirements

- **Node.js** 18+ (https://nodejs.org)
- **Windows 10 or later**
- **Chrome/Edge** browser

## Default Login

| Field     | Value       |
|-----------|-------------|
| Login ID  | admin       |
| Password  | admin123    |

## Building the Windows Installer

1. Install [Inno Setup 6](https://jrsoftware.org/isinfo.php)
2. Build the frontend first: `npm run build:frontend`
3. Open `setup.iss` in Inno Setup Compiler
4. Click Compile → generates `SNC-Patient-Register-Setup-1.0.0.exe`

## Project Structure (Complete)

| File | Purpose |
|------|---------|
| `app.js` | Express server — routes, middleware, static files |
| `database.js` | SQLite schema + auto-creates all tables on first run |
| `routes/auth.js` | Login, logout, user management, roles |
| `routes/patients.js` | Patient CRUD |
| `routes/sessions.js` | Treatment session management |
| `routes/payments.js` | Payment tracking |
| `routes/regular.js` | Recurring visit plans |
| `routes/dashboard.js` | Stats, charts, follow-ups |
| `routes/telegram.js` | Telegram bot configuration |
| `routes/roles.js` | Permission matrix |
| `public/index.html` | Frontend UI (HTML/CSS/JS) |
| `data/snc.db` | SQLite database (auto-created) |
| `logs/app.log` | Server log file (auto-created) |

## Ports

- Backend API: `http://localhost:3000`
- Frontend: served from `public/` on same port
- All data stored locally in `data/snc.db`
- No internet required after installation

## For Developers

```powershell
# Development
node app.js

# Build frontend (if React files changed)
cd snc
npm install
npm run build
cd ..

# Package as Windows installer
# 1. Run npm install
# 2. Run npm run build:frontend
# 3. Open setup.iss in Inno Setup
```

## Troubleshooting

**Port 3000 already in use:**
```powershell
netstat -aon | findstr :3000
taskkill /PID <pid> /F
```

**Frontend not loading:**
- Run `npm run build:frontend` first to build the React app
- Check that `public/index.html` exists

**Login fails:**
- Wait 10 seconds for tables to be seeded on first run
- Default: `admin` / `admin123`