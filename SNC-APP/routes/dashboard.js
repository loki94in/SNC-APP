const express = require('express');
const { getDb, now } = require('../database');

const router = express.Router();
const MONTHS_ARR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// GET /api/dashboard
router.get('/', (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const todayRevenue = db.prepare('SELECT COALESCE(SUM(amount),0) as t FROM payments WHERE DATE(created_at)=?').get(today);
  const totalPatients = db.prepare('SELECT COUNT(*) as c FROM patients WHERE active=1').get();
  const todaySessions = db.prepare('SELECT COUNT(*) as c FROM sessions WHERE date=?').get(today);
  const monthRevenue = db.prepare('SELECT COALESCE(SUM(amount),0) as t FROM payments WHERE created_at >= ?').get(today.slice(0,7) + '-01');
  const activePlans = db.prepare('SELECT COUNT(*) as c FROM regular_plans WHERE active=1').get();
  const recentPatients = db.prepare('SELECT * FROM patients WHERE active=1 ORDER BY created_at DESC LIMIT 5').all();
  return res.json({
    stats: {
      totalPatients: totalPatients?.c ?? 0,
      todaySessions: todaySessions?.c ?? 0,
      todayRevenue: todayRevenue?.t ?? 0,
      monthRevenue: monthRevenue?.t ?? 0,
      activePlans: activePlans?.c ?? 0,
    },
    recentPatients,
  });
});

// GET /api/dashboard/charts
router.get('/charts', (req, res) => {
  const db = getDb();
  const months = [], revenueData = [], patientData = [], sessionData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const m = d.getMonth(), y = d.getFullYear();
    months.push(MONTHS_ARR[m]);
    const mStart = `${y}-${String(m+1).padStart(2,'0')}-01`;
    const mEnd = `${y}-${String(m+1).padStart(2,'0')}-31`;
    const rev = db.prepare('SELECT COALESCE(SUM(amount),0) as t FROM payments WHERE created_at>=? AND created_at<=?').get(mStart, mEnd);
    const pts = db.prepare('SELECT COUNT(*) as c FROM patients WHERE active=1 AND created_at>=? AND created_at<=?').get(mStart, mEnd);
    const ssn = db.prepare('SELECT COUNT(*) as c FROM sessions WHERE date>=? AND date<=?').get(mStart, mEnd);
    revenueData.push(rev?.t ?? 0);
    patientData.push(pts?.c ?? 0);
    sessionData.push(ssn?.c ?? 0);
  }
  return res.json({ months, revenueData, patientData, sessionData });
});

// GET /api/dashboard/audit-log
router.get('/audit-log', (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const db = getDb();
  const logs = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100').all();
  return res.json({ logs });
});

// GET /api/dashboard/follow-ups
router.get('/follow-ups', (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const followUps = db.prepare(
    `SELECT s.id,s.patient_id,s.session_no,s.date,s.followup,p.name as patient_name
     FROM sessions s LEFT JOIN patients p ON p.id=s.patient_id
     WHERE s.followup IS NOT NULL AND s.followup!='' AND s.followup>=?
     ORDER BY s.followup ASC LIMIT 50`
  ).all(today);
  return res.json({ followUps });
});

module.exports = router;
