const express = require('express');
const { getDb, now } = require('../database');

const router = express.Router();
const { v4: uid } = require('uuid');

// GET /api/sessions
router.get('/', (req, res) => {
  const db = getDb();
  const sessions = db.prepare(`
    SELECT s.*, p.name as patient_name
    FROM sessions s
    LEFT JOIN patients p ON p.id = s.patient_id
    ORDER BY s.session_no DESC
  `).all();
  return res.json({ sessions });
});

// GET /api/sessions/by-patient/:patientId
router.get('/by-patient/:patientId', (req, res) => {
  const db = getDb();
  const sessions = db.prepare(`
    SELECT s.*, p.name as patient_name
    FROM sessions s
    LEFT JOIN patients p ON p.id = s.patient_id
    WHERE s.patient_id = ?
    ORDER BY s.session_no DESC
  `).all(req.params.patientId);
  return res.json({ sessions });
});

// POST /api/sessions
router.post('/', (req, res) => {
  const db = getDb();
  const {
    patientId, date, visitType, clinicianId, clinicianName, duration,
    payment, paymentMode, pre, post, followup
  } = req.body;

  if (!patientId || !date) return res.status(400).json({ error: 'patientId and date required' });

  const last = db.prepare('SELECT MAX(session_no) as m FROM sessions WHERE patient_id=?').get(patientId);
  const sessionNo = (last?.m || 0) + 1;
  const id = uid();

  db.prepare(`INSERT INTO sessions
    (id,patient_id,session_no,date,visit_type,clinician_id,clinician_name,duration,payment,payment_mode,
     pre_complaint,pre_pain,pre_mobility,pre_vitals,pre_notes,
     post_techniques,post_pain,post_response,post_notes,post_recommendation,followup,
     created_by,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    id, patientId, sessionNo, date, visitType || 'IN-CLINIC',
    clinicianId || '', clinicianName || '', duration || 0,
    payment || 0, paymentMode || 'CASH',
    pre?.complaint || '', pre?.pain || 0, pre?.mobility || '', pre?.vitals || '', pre?.notes || '',
    post?.techniques || '', post?.pain || 0, post?.response || '', post?.notes || '', post?.recommendation || '',
    followup || '', req.user.id, now(), now()
  );

  if (payment && parseFloat(payment) > 0) {
    db.prepare('INSERT INTO payments (id,patient_id,session_id,amount,mode,notes,recorded_by,created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(uid(), patientId, id, payment, paymentMode || 'CASH', `Session #${sessionNo}`, req.user.id, now());
  }

  return res.json({ ok: true, id, sessionNo }, 201);
});

// PUT /api/sessions/:id
router.put('/:id', (req, res) => {
  const db = getDb();
  const { date, visitType, clinicianId, clinicianName, duration, payment, paymentMode, pre, post, followup } = req.body;

  db.prepare(`UPDATE sessions SET
    date=?, visit_type=?, clinician_id=?, clinician_name=?, duration=?, payment=?, payment_mode=?,
    pre_complaint=?, pre_pain=?, pre_mobility=?, pre_vitals=?, pre_notes=?,
    post_techniques=?, post_pain=?, post_response=?, post_notes=?, post_recommendation=?, followup=?, updated_at=?
    WHERE id=?`).run(
    date, visitType || 'IN-CLINIC', clinicianId || '', clinicianName || '',
    duration || 0, payment || 0, paymentMode || 'CASH',
    pre?.complaint || '', pre?.pain || 0, pre?.mobility || '', pre?.vitals || '', pre?.notes || '',
    post?.techniques || '', post?.pain || 0, post?.response || '', post?.notes || '', post?.recommendation || '',
    followup || '', now(), req.params.id
  );
  return res.json({ ok: true });
});

// DELETE /api/sessions/:id
router.delete('/:id', (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Only ADMIN can delete sessions' });
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE id=?').run(req.params.id);
  db.prepare('DELETE FROM payments WHERE session_id=?').run(req.params.id);
  return res.json({ ok: true });
});

module.exports = router;
