const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createTables, getDb, now } = require('./database');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'snc-secret-key-change-in-production';
const LOG_FILE = path.join(__dirname, 'logs', 'app.log');

// Ensure logs directory exists
if (!fs.existsSync(path.dirname(LOG_FILE))) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
}

// Simple logger
function log(level, msg) {
  const entry = `[${new Date().toISOString()}] [${level}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, entry);
  console.log(entry.trim());
}

// Global error handler
process.on('uncaughtException', (err) => {
  log('ERROR', err.message);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  log('ERROR', String(err));
});

// ─── Setup ───────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '512kb' }));

// ─── Security Headers ───────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ─── Auth Middleware ────────────────────────────────────────
function requireAuth(req, res, next) {
  const publicPaths = ['/api/auth/login', '/api/auth/logout', '/api/auth/bypass-login'];
  if (publicPaths.includes(req.path)) return next();

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND active = 1').get(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.use('/api', requireAuth);

// ─── Audit helper ───────────────────────────────────────────
function audit(event, userId, details) {
  try {
    const db = getDb();
    const { v4: uid } = require('uuid');
    db.prepare('INSERT INTO audit_log (id, event, user_id, details, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(uid(), event, userId || null, details || null, now());
  } catch { /* silent */ }
}

// ─── Routes ───────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const patientsRoutes = require('./routes/patients');
const sessionsRoutes = require('./routes/sessions');
const paymentsRoutes = require('./routes/payments');
const regularRoutes = require('./routes/regular');
const dashboardRoutes = require('./routes/dashboard');
const telegramRoutes = require('./routes/telegram');

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/regular', regularRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/roles', require('./routes/roles'));

// ─── Serve frontend ────────────────────────────────────────
const PUBLIC_DIR = path.join(__dirname, 'public');
app.use(express.static(PUBLIC_DIR));
app.get('*', (req, res) => {
  const indexPath = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('<h1>Frontend not found. Run: npm run build:frontend</h1>');
  }
});

// ─── Start ─────────────────────────────────────────────────
createTables();
log('INFO', `SNC Backend running on http://localhost:${PORT}`);
app.listen(PORT);
