const express = require('express');
const { getDb, now } = require('../database');

const router = express.Router();
const { v4: uid } = require('uuid');

// GET /api/patients
router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM patients WHERE active=1 ORDER BY created_at DESC').all();
  const result = rows.map(r => ({
    id: r.id, regNo: r.reg_no, name: r.name, age: r.age, sex: r.sex,
    occupation: r.occupation, address: r.address, mobile: r.mobile,
    telephone: r.telephone || '', conditions: safeJson(r.conditions, []),
    restrictions: safeJson(r.restrictions, []), history: r.history || '',
    active: r.active === 1, createdAt: r.created_at
  }));
  return res.json({ patients: result });
});

// GET /api/patients/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const r = db.prepare('SELECT * FROM patients WHERE id=?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  return res.json({
    id: r.id, regNo: r.reg_no, name: r.name, age: r.age, sex: r.sex,
    occupation: r.occupation, address: r.address, mobile: r.mobile,
    telephone: r.telephone || '', conditions: safeJson(r.conditions, []),
    restrictions: safeJson(r.restrictions, []), history: r.history || '',
    active: r.active === 1, createdAt: r.created_at
  });
});

// POST /api/patients
router.post('/', (req, res) => {
  const { name, mobile, regNo, age, sex, occupation, address, telephone, history, conditions, restrictions } = req.body;
  if (!name || !mobile) return res.status(400).json({ error: 'name and mobile required' });

  const db = getDb();
  const allPatients = db.prepare('SELECT * FROM patients').all();
  const regNumber = regNo || 'SNC' + String(allPatients.length + 1).padStart(4, '0');
  const id = uid();

  db.prepare(`INSERT INTO patients (id,reg_no,name,age,sex,occupation,address,mobile,telephone,conditions,restrictions,history,active,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)`).run(
    id, regNumber, name, age || '', sex || 'Male', occupation || '', address || '', mobile,
    telephone || '', JSON.stringify(conditions || []), JSON.stringify(restrictions || []),
    history || '', now(), now()
  );
  return res.json({ ok: true, id, regNo: regNumber }, 201);
});

// PATCH /api/patients/:id
router.patch('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM patients WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const {
    regNo, name, age, sex, occupation, address, mobile, telephone, history, conditions, restrictions, active
  } = req.body;

  const fields = [], vals = [];
  if (regNo !== undefined) { fields.push('reg_no=?'); vals.push(regNo); }
  if (name !== undefined) { fields.push('name=?'); vals.push(name); }
  if (age !== undefined) { fields.push('age=?'); vals.push(age); }
  if (sex !== undefined) { fields.push('sex=?'); vals.push(sex); }
  if (occupation !== undefined) { fields.push('occupation=?'); vals.push(occupation); }
  if (address !== undefined) { fields.push('address=?'); vals.push(address); }
  if (mobile !== undefined) { fields.push('mobile=?'); vals.push(mobile); }
  if (telephone !== undefined) { fields.push('telephone=?'); vals.push(telephone); }
  if (history !== undefined) { fields.push('history=?'); vals.push(history); }
  if (conditions !== undefined) { fields.push('conditions=?'); vals.push(JSON.stringify(conditions)); }
  if (restrictions !== undefined) { fields.push('restrictions=?'); vals.push(JSON.stringify(restrictions)); }
  if (active !== undefined) { fields.push('active=?'); vals.push(active ? 1 : 0); }
  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

  fields.push('updated_at=?'); vals.push(now()); vals.push(req.params.id);
  db.prepare(`UPDATE patients SET ${fields.join(',')} WHERE id=?`).run(...vals);
  return res.json({ ok: true });
});

// DELETE /api/patients/:id (soft delete)
router.delete('/:id', (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const db = getDb();
  db.prepare('UPDATE patients SET active=0, updated_at=? WHERE id=?').run(now(), req.params.id);
  return res.json({ ok: true });
});

function safeJson(str, fallback) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

module.exports = router;
