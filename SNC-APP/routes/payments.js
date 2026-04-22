const express = require('express');
const { getDb, now } = require('../database');

const router = express.Router();
const { v4: uid } = require('uuid');

// GET /api/payments
router.get('/', (req, res) => {
  const db = getDb();
  const { patientId, from, to } = req.query;
  let q = 'SELECT p.*, pt.name as patient_name FROM payments p LEFT JOIN patients pt ON p.patient_id=pt.id WHERE 1=1';
  const args = [];
  if (patientId) { q += ' AND p.patient_id=?'; args.push(patientId); }
  if (from) { q += ' AND p.created_at>=?'; args.push(from); }
  if (to) { q += ' AND p.created_at<=?'; args.push(to); }
  q += ' ORDER BY p.created_at DESC';
  return res.json({ payments: db.prepare(q).all(...args) });
});

// POST /api/payments
router.post('/', (req, res) => {
  const { patientId, sessionId, amount, mode, notes } = req.body;
  if (!patientId || !amount) return res.status(400).json({ error: 'patientId and amount required' });
  const db = getDb();
  const id = uid();
  db.prepare('INSERT INTO payments (id,patient_id,session_id,amount,mode,notes,recorded_by,created_at) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, patientId, sessionId || null, amount, mode || 'CASH', notes || '', req.user.id, now());
  return res.json({ ok: true, id }, 201);
});

module.exports = router;
