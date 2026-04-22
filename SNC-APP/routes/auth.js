const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb, now } = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'snc-secret-key-change-in-production';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { loginId, password } = req.body;
  if (!loginId || !password) return res.status(400).json({ error: 'Missing credentials' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE login_id = ? AND active = 1').get(loginId);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    audit(db, null, `Failed login: ${loginId}`);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, login_id: user.login_id, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
  audit(db, user.id, `User logged in: ${user.login_id}`);
  return res.json({
    token,
    user: { id: user.id, login_id: user.login_id, name: user.name, role: user.role },
    mustChangePassword: !!user.must_change_password
  });
});

// POST /api/auth/bypass-login (admin shortcut for dev)
router.post('/bypass-login', (req, res) => {
  const db = getDb();
  const bypass = db.prepare("SELECT value FROM app_config WHERE key = 'login_bypass'").get();
  if (!bypass || bypass.value !== 'true') {
    return res.status(403).json({ error: 'Bypass not enabled' });
  }
  const user = db.prepare("SELECT * FROM users WHERE role='ADMIN' AND active=1").get();
  if (!user) return res.status(500).json({ error: 'No admin user found' });

  const token = jwt.sign(
    { id: user.id, login_id: user.login_id, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
  audit(db, user.id, 'Login bypass used');
  return res.json({
    token,
    user: { id: user.id, login_id: user.login_id, name: user.name, role: user.role },
    mustChangePassword: false
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  return res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  return res.json({ user: req.user });
});

// GET /api/auth/permissions
router.get('/permissions', (req, res) => {
  const db = getDb();
  const perms = db.prepare('SELECT screen, level FROM permissions WHERE role = ?').all(req.user.role);
  const map = {};
  for (const p of perms) map[p.screen] = p.level;
  return res.json({ permissions: map, role: req.user.role });
});

// POST /api/auth/change-password
router.post('/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!bcrypt.compareSync(currentPassword, req.user.password_hash)) {
    return res.status(400).json({ error: 'Current password incorrect' });
  }
  if (newPassword.length < 8) return res.status(400).json({ error: 'Min 8 characters' });

  const db = getDb();
  db.prepare('UPDATE users SET password_hash=?, must_change_password=0, updated_at=? WHERE id=?')
    .run(bcrypt.hashSync(newPassword, 10), now(), req.user.id);
  audit(db, req.user.id, 'User changed password');
  return res.json({ ok: true });
});

// POST /api/auth/users
router.post('/users', (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { loginId, password, name, role } = req.body;
  if (!loginId || !password || !name) return res.status(400).json({ error: 'Missing fields' });

  const db = getDb();
  if (db.prepare('SELECT id FROM users WHERE login_id = ?').get(loginId)) {
    return res.status(400).json({ error: 'Login ID taken' });
  }
  const { v4: uid } = require('uuid');
  db.prepare(`INSERT INTO users (id, login_id, password_hash, name, role, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)`).run(
    uid(), loginId, bcrypt.hashSync(password, 10), name, role || 'RECEPTIONIST', now(), now()
  );
  audit(db, req.user.id, `Created user: ${loginId}`);
  return res.json({ ok: true }, 201);
});

// GET /api/auth/users
router.get('/users', (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const db = getDb();
  const users = db.prepare('SELECT id, login_id, name, role, active, must_change_password, created_at FROM users').all();
  return res.json({ users });
});

// DELETE /api/auth/users/:id
router.delete('/users/:id', (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  const db = getDb();
  db.prepare('UPDATE users SET active=0, updated_at=? WHERE id=?').run(now(), req.params.id);
  audit(db, req.user.id, `Deleted user: ${req.params.id}`);
  return res.json({ ok: true });
});

// POST /api/auth/roles
router.post('/roles', (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: 'Role name required' });
  const db = getDb();
  const { v4: uid } = require('uuid');
  const defaultScreens = db.prepare("SELECT screen FROM permissions WHERE role='RECEPTIONIST'").all();
  const insertPerm = db.prepare('INSERT OR IGNORE INTO permissions (id, role, screen, level) VALUES (?, ?, ?, ?)');
  for (const s of defaultScreens) insertPerm.run(uid(), role, s.screen, 'HIDDEN');
  audit(db, req.user.id, `Created role: ${role}`);
  return res.json({ ok: true }, 201);
});

function audit(db, userId, details) {
  try {
    const { v4: uid } = require('uuid');
    db.prepare('INSERT INTO audit_log (id, event, user_id, details, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(uid(), 'AUTH', userId || null, details || null, now());
  } catch { /* silent */ }
}

module.exports = router;
