const express = require('express');
const { getDb, now } = require('../database');

const router = express.Router();
const { v4: uid } = require('uuid');

// GET /api/regular or /api/regular?patientId=xxx
router.get('/', (req, res) => {
  const db = getDb();
  const pid = req.query.patientId;
  if (pid) {
    const plans = db.prepare('SELECT * FROM regular_plans WHERE patient_id=? ORDER BY created_at DESC').all(pid);
    return res.json(plans);
  }
  const plans = db.prepare(`
    SELECT rp.*, p.name as patientName FROM regular_plans rp
    LEFT JOIN patients p ON rp.patient_id=p.id
    WHERE rp.active=1 ORDER BY rp.created_at DESC
  `).all();
  return res.json(plans);
});

// GET /api/regular/today
router.get('/today', (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const plans = db.prepare(`
    SELECT rp.*, p.name as patientName FROM regular_plans rp
    LEFT JOIN patients p ON rp.patient_id=p.id
    WHERE rp.active=1 AND rp.start_date <= ? AND (rp.end_date IS NULL OR rp.end_date='' OR rp.end_date >= ?)
    ORDER BY rp.created_at DESC
  `).all(today, today);
  return res.json(plans);
});

// POST /api/regular/plan
router.post('/plan', (req, res) => {
  const { patientId, frequency, days, protocol, startDate, endDate, targetCount } = req.body;
  if (!patientId) return res.status(400).json({ error: 'patientId required' });
  const db = getDb();
  const existing = db.prepare('SELECT id FROM regular_plans WHERE patient_id=? AND active=1').get(patientId);

  if (existing) {
    db.prepare('UPDATE regular_plans SET frequency=?,days=?,protocol=?,start_date=?,end_date=?,target_count=?,updated_at=? WHERE id=?')
      .run(frequency || 'WEEKLY', JSON.stringify(days || []), protocol || '', startDate || '', endDate || '', targetCount || 0, now(), existing.id);
    return res.json({ ok: true, id: existing.id });
  }

  const id = uid();
  db.prepare(`INSERT INTO regular_plans (id,patient_id,frequency,days,protocol,start_date,end_date,target_count,active,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,1,?,?)`)
    .run(id, patientId, frequency || 'WEEKLY', JSON.stringify(days || []), protocol || '',
         startDate || '', endDate || '', targetCount || 0, now(), now());
  return res.json({ ok: true, id });
});

// GET /api/regular/:id/stats
router.get('/:id/stats', (req, res) => {
  const db = getDb();
  const plan = db.prepare('SELECT * FROM regular_plans WHERE id=?').get(req.params.id);
  if (!plan) return res.status(404).json({ error: 'Plan not found' });
  const total = db.prepare('SELECT COUNT(*) as c FROM regular_visits WHERE plan_id=?').get(req.params.id);
  const attended = db.prepare('SELECT COUNT(*) as c FROM regular_visits WHERE plan_id=? AND attended=1').get(req.params.id);
  const sessions = db.prepare('SELECT COUNT(*) as c FROM sessions WHERE patient_id=?').get(plan.patient_id);
  return res.json({
    attendanceRate: total?.c > 0 ? Math.round((attended?.c / total?.c) * 100) : 0,
    totalVisits: total?.c || 0,
    attendedVisits: attended?.c || 0,
    sessionsCount: sessions?.c || 0,
    targetCount: plan.target_count || 0,
  });
});

module.exports = router;
