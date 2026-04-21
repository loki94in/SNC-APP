import { Hono } from "hono";
import { db } from "../db.js";

const MONTHS_ARR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const dashboard = new Hono();

dashboard.get("/", async (c) => {
  const today = new Date().toISOString().slice(0, 10);
  const todayRevenue = db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM payments WHERE DATE(created_at)=?").get(today) as any;
  const totalPatients = db.prepare("SELECT COUNT(*) as c FROM patients WHERE active=1").get() as any;
  const todaySessions = db.prepare("SELECT COUNT(*) as c FROM sessions WHERE date=?").get(today) as any;
  const monthRevenue = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE created_at >= ?").get(today.slice(0, 7) + "-01") as any;
  const activePlans = db.prepare("SELECT COUNT(*) as c FROM regular_plans WHERE active=1").get() as any;
  const recentPatients = db.prepare("SELECT * FROM patients WHERE active=1 ORDER BY created_at DESC LIMIT 5").all();
  return c.json({
    stats: {
      totalPatients: totalPatients?.c ?? 0,
      todaySessions: todaySessions?.c ?? 0,
      todayRevenue: todayRevenue?.t ?? 0,
      monthRevenue: monthRevenue?.total ?? 0,
      activePlans: activePlans?.c ?? 0,
    },
    recentPatients,
  });
});

dashboard.get("/charts", async (c) => {
  const months: string[] = [];
  const revenueData: number[] = [];
  const patientData: number[] = [];
  const sessionData: number[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = d.getMonth();
    const y = d.getFullYear();
    const label = MONTHS_ARR[m];
    months.push(label);

    const monthStart = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const monthEnd = `${y}-${String(m + 1).padStart(2, "0")}-31`;

    const rev = db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM payments WHERE created_at >= ? AND created_at <= ?").get(monthStart, monthEnd) as any;
    const pts = db.prepare("SELECT COUNT(*) as c FROM patients WHERE active=1 AND created_at >= ? AND created_at <= ?").get(monthStart, monthEnd) as any;
    const ssn = db.prepare("SELECT COUNT(*) as c FROM sessions WHERE date >= ? AND date <= ?").get(monthStart, monthEnd) as any;

    revenueData.push(rev?.t ?? 0);
    patientData.push(pts?.c ?? 0);
    sessionData.push(ssn?.c ?? 0);
  }

  return c.json({ months, revenueData, patientData, sessionData });
});

dashboard.get("/audit-log", async (c) => {
  const user = c.get("user") as any;
  if (user?.role !== "ADMIN") return c.json({ error: "Forbidden" }, 403);
  const logs = db.prepare("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100").all();
  return c.json({ logs });
});

dashboard.get("/daily-revenue", async (c) => {
  const td = new Date().toISOString().slice(0, 10);
  const todayRevenue = db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM payments WHERE DATE(created_at)=?").get(td) as any;
  const dailyRevenue = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE DATE(created_at)=?").get(td) as any;
  return c.json({ todayRevenue: todayRevenue?.t ?? 0, dailyRevenue: dailyRevenue?.total ?? 0 });
});

dashboard.get("/recent-patients", async (c) => {
  const recentPatients = db.prepare("SELECT * FROM patients WHERE active=1 ORDER BY created_at DESC LIMIT 5").all();
  return c.json({ recentPatients });
});

dashboard.get("/follow-ups", async (c) => {
  const user = c.get("user") as any;
  if (user?.role !== "ADMIN") return c.json({ error: "Forbidden" }, 403);
  const today = new Date().toISOString().slice(0, 10);
  const followUps = db.prepare(
    "SELECT s.id, s.patient_id, s.session_no, s.date, s.followup, p.name as patient_name FROM sessions s LEFT JOIN patients p ON p.id=s.patient_id WHERE s.followup IS NOT NULL AND s.followup != '' AND s.followup >= ? ORDER BY s.followup ASC LIMIT 50"
  ).all(today);
  return c.json({ followUps });
});

export default dashboard;
