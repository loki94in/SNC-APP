import { Hono } from "hono";
import { db } from "../db.js";
const dashboard = new Hono();

dashboard.get("/", async (c) => {
  const today = new Date().toISOString().slice(0,10);
  const totalPatients = db.prepare("SELECT COUNT(*) as c FROM patients WHERE active=1").get() as any;
  const todaySessions = db.prepare("SELECT COUNT(*) as c FROM sessions WHERE date=?").get(today) as any;
  const monthRevenue = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE created_at >= ?").get(today.slice(0,7) + "-01") as any;
  const activePlans = db.prepare("SELECT COUNT(*) as c FROM regular_plans WHERE active=1").get() as any;
  const recentPatients = db.prepare("SELECT * FROM patients WHERE active=1 ORDER BY created_at DESC LIMIT 5").all();
  return c.json({
    stats: {
      totalPatients: totalPatients.c,
      todaySessions: todaySessions.c,
      monthRevenue: monthRevenue.total,
      activePlans: activePlans.c,
    },
    recentPatients
  });
});

// GET /api/dashboard/charts → 6-month trends for revenue, patients, sessions
dashboard.get("/charts", async (c) => {
  const months: string[] = [];
  const revenueData: number[] = [];
  const patientData: number[] = [];
  const sessionData: number[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const ym = d.toISOString().slice(0, 7); // "2026-03"
    months.push(ym);

    const monthStart = ym + "-01";
    const monthEnd = ym + "-31";

    const rev = db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM payments WHERE created_at >= ? AND created_at <= ?").get(monthStart, monthEnd) as any;
    const pts = db.prepare("SELECT COUNT(*) as c FROM patients WHERE active=1 AND created_at >= ? AND created_at <= ?").get(monthStart, monthEnd) as any;
    const ssn = db.prepare("SELECT COUNT(*) as c FROM sessions WHERE date >= ? AND date <= ?").get(ym + "-01", ym + "-31") as any;

    revenueData.push(rev.t);
    patientData.push(pts.c);
    sessionData.push(ssn.c);
  }

  return c.json({ months, revenueData, patientData, sessionData });
});

dashboard.get("/audit-log", async (c) => {
  const user = c.get("user") as any;
  if (user.role !== "ADMIN") return c.json({ error: "Forbidden" }, 403);
  const logs = db.prepare("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100").all();
  return c.json({ logs });
});

export default dashboard;
