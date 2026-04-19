import { Hono } from "hono";
import { db, now } from "../db.js";
import { v4 as uid } from "uuid";
import { audit } from "../audit.js";
const regular = new Hono();

// GET /api/regular or /api/regular?patientId=xxx → list plans (for patient or all)
regular.get("/", async (c) => {
  const pid = c.req.query("patientId");
  if (pid) {
    const plans = db.prepare("SELECT * FROM regular_plans WHERE patient_id=? ORDER BY created_at DESC").all(pid);
    return c.json(plans);
  }
  const plans = db.prepare("SELECT rp.*, p.name as patientName FROM regular_plans rp LEFT JOIN patients p ON rp.patient_id=p.id WHERE rp.active=1 ORDER BY rp.created_at DESC").all();
  return c.json(plans);
});

// GET /api/regular/:id
regular.get("/:id", async (c) => {
  const plan = db.prepare("SELECT * FROM regular_plans WHERE id=?").get(c.req.param("id"));
  return c.json(plan || null);
});

// POST /api/regular/plan → create/update plan (body: patientId, frequency, days, protocol, etc.)
regular.post("/plan", async (c) => {
  const user = c.get("user") as any;
  const b = await c.req.json();
  if (!b.patientId) return c.json({ error: "patientId required" }, 400);
  const existing = db.prepare("SELECT id FROM regular_plans WHERE patient_id=? AND active=1").get(b.patientId) as any;
  if (existing) {
    db.prepare("UPDATE regular_plans SET frequency=?,days=?,protocol=?,start_date=?,end_date=?,target_count=?,updated_at=? WHERE id=?").run(b.frequency||"WEEKLY", JSON.stringify(b.days||[]), b.protocol||"", b.startDate||"", b.endDate||"", b.targetCount||0, now(), existing.id);
    audit("REGULAR_PLAN_UPDATED", user.id, `Updated plan for patient: ${b.patientId}`);
    return c.json({ ok: true, id: existing.id });
  }
  const id = uid();
  db.prepare(`INSERT INTO regular_plans (id,patient_id,frequency,days,protocol,start_date,end_date,target_count,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,1,?,?)`).run(id, b.patientId, b.frequency||"WEEKLY", JSON.stringify(b.days||[]), b.protocol||"", b.startDate||"", b.endDate||"", b.targetCount||0, now(), now());
  audit("REGULAR_PLAN_CREATED", user.id, `Created plan for patient: ${b.patientId}`);
  return c.json({ ok: true, id });
});

// GET /api/regular/:id/entries
regular.get("/:id/entries", async (c) => {
  const entries = db.prepare("SELECT * FROM visit_entries WHERE plan_id=? ORDER BY date DESC").all(c.req.param("id"));
  return c.json(entries);
});

// POST /api/regular/:id/entries → add visit entry
regular.post("/:id/entries", async (c) => {
  const user = c.get("user") as any;
  const b = await c.req.json();
  if (!b.date) return c.json({ error: "date required" }, 400);
  const existing = db.prepare("SELECT id FROM visit_entries WHERE plan_id=? AND date=?").get(c.req.param("id"), b.date) as any;
  if (existing) {
    db.prepare("UPDATE visit_entries SET attended=?,absent=?,absence_reason=?,treatment=?,clinician_id=?,duration=?,notes=?,patient_condition=?,updated_at=? WHERE id=?").run(b.attended?1:0, b.absent?1:0, b.absenceReason||"", b.treatment||"", b.clinicianId||"", b.duration||0, b.notes||"", b.patientCondition||"NOT_ASSESSED", now(), existing.id);
    return c.json({ ok: true, id: existing.id });
  }
  const id = uid();
  db.prepare(`INSERT INTO visit_entries (id,plan_id,date,attended,absent,absence_reason,treatment,clinician_id,duration,notes,patient_condition,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id, c.req.param("id"), b.date, b.attended?1:0, b.absent?1:0, b.absenceReason||"", b.treatment||"", b.clinicianId||"", b.duration||0, b.notes||"", b.patientCondition||"NOT_ASSESSED", now(), now());
  audit("VISIT_ENTRY_ADDED", user.id, `Visit entry for plan: ${c.req.param("id")}, date: ${b.date}`);
  return c.json({ ok: true, id });
});

// GET /api/regular/today → plans due today
regular.get("/today", async (c) => {
  const today = new Date().toISOString().slice(0,10);
  const plans = db.prepare(`SELECT rp.*, p.name as patientName FROM regular_plans rp
    LEFT JOIN patients p ON rp.patient_id=p.id
    WHERE rp.active=1 AND rp.start_date <= ? AND (rp.end_date IS NULL OR rp.end_date='' OR rp.end_date >= ?)
    ORDER BY rp.created_at DESC`).all(today, today);
  return c.json(plans);
});

export default regular;
