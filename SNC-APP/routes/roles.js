const express = require('express');
const { getDb } = require('../database');

const router = express.Router();

// GET /api/roles/permissions
router.get('/permissions', (req, res) => {
  const db = getDb();
  return res.json({ permissions: db.prepare('SELECT * FROM permissions ORDER BY role, screen').all() });
});

// PUT /api/roles/permissions
router.put('/permissions', (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { permissions } = req.body;
  const db = getDb();
  const { v4: uid } = require('uuid');
  const update = db.prepare('INSERT OR REPLACE INTO permissions (id, role, screen, level) VALUES (?, ?, ?, ?)');
  for (const p of permissions) {
    const existing = db.prepare('SELECT id FROM permissions WHERE role=? AND screen=?').get(p.role, p.screen);
    update.run(existing?.id || uid(), p.role, p.screen, p.level);
  }
  return res.json({ ok: true });
});

// GET /api/roles/roles
router.get('/roles', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT DISTINCT role FROM permissions').all();
  return res.json({ roles: rows.map(r => r.role) });
});

module.exports = router;
