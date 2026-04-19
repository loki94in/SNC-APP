import { Hono } from "hono";
import { db, now } from "../db.js";
import { v4 as uid } from "uuid";
import { audit } from "../audit.js";
const regular = new Hono();
regular.get("/plan/:patientId", async (c) => {
  const plan = db.prepare("SELECT * FROM regular_plans WHERE patient_id=? AND active=1 LIMIT 1").get(c.req.param("patientId"));
  return c.json({ plan: plan || null });
});
regular.post("/plan", async (c) => {
  const user = c.get("user") as any;
  const b = await c.req.json();
  const existing = db.prepare("SELECT id FROM regular_plans WHERE patient_id=? AND active=1").get(b.patientId) as any;
  if (existing) {
    db.prepare("UPDATE regular_plans SET frequency=?,days=?,protocol=?,start_date=?,end_date=?,target_count=?,updated_at=? WHERE id=?").run(b.frequency, JSON.stringify(b.days||[]), b.protocol||"", b.startDate||"", b.endDate||"", b.targetCount||0, now(), existing.id);
    audit("REGULAR_PLAN_UPDATED", user.id, `Updated plan for patient: ${b.patientId}`);
    return c.json({ ok: true, id: existing.id });
  }
  const id = uid();
  db.prepare(`INSERT INTO regular_plans (id,patient_id,frequency,days,protocol,start_date,end_date,target_count,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,1,?,?)`).run(id, b.patientId, b.frequency, JSON.stringify(b.days||[]), b.protocol||"", b.startDate||"", b.endDate||"", b.targetCount||0, now(), now());
  audit("REGULAR_PLAN_CREATED", user.id, `Created plan for patient: ${b.patientId}`);
  return c.json({ ok: true, id }, 201);
});
regular.get("/visits/:planId", async (c) => {
  return c.json({ visits: db.prepare("SELECT * FROM regular_visits WHERE plan_id=? ORDER BY visit_date DESC").all(c.req.param("planId")) });
});
regular.post("/visits", async (c) => {
  const user = c.get("user") as any;
  const b = await c.req.json();
  const id = uid();
  db.prepare(`INSERT INTO regular_visits (id,plan_id,patient_id,visit_date,attended,absence_reason,treatment,clinician_id,duration,notes,session_id,payment,payment_mode,condition_status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    id, b.planId, b.patientId, b.visitDate, b.attended?1:0, b.absenceReason||"", b.treatment||"", b.clinicianId||"", b.duration||0,
    b.notes||"", b.sessionId||null, b.payment||0, b.paymentMode||"CASH", b.conditionStatus||"", now()
  );
  if (b.payment && parseFloat(b.payment) > 0) {
    db.prepare("INSERT INTO payments (id,patient_id,amount,mode,notes,recorded_by,created_at) VALUES (?,?,?,?,?,?,?)").run(uid(), b.patientId, b.payment, b.paymentMode||"CASH", "Regular visit", user.id, now());
  }
  audit("REGULAR_VISIT_LOGGED", user.id, `Logged visit for patient: ${b.patientId} on ${b.visitDate}`);
  return c.json({ ok: true, id }, 201);
});
regular.get("/today", async (c) => {
  const today = new Date().toISOString().slice(0,10);
  const plans = db.prepare("SELECT rp.*, p.name as patient_name FROM regular_plans rp JOIN patients p ON rp.patient_id=p.id WHERE rp.active=1").all() as any[];
  const dayMap = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const dow = dayMap[new Date(today).getDay()];
  const result = plans.filter(plan => {
    try { const days: string[] = JSON.parse(plan.days||"[]"); return days.includes(dow); } catch { return false; }
  });
  return c.json({ plans: result });
});
export default regular;
