import { Hono } from "hono";
import { db, now } from "../db.js";
import { v4 as uid } from "uuid";
import { audit } from "../audit.js";
const sessions = new Hono();

sessions.get("/", async (c) => {
  const sessions = db.prepare(`
    SELECT s.*, p.name as patient_name 
    FROM sessions s 
    LEFT JOIN patients p ON p.id = s.patient_id 
    ORDER BY s.session_no DESC
  `).all();
  return c.json({ sessions });
});

sessions.get("/by-patient/:patientId", async (c) => {
  return c.json({ sessions: db.prepare("SELECT * FROM sessions WHERE patient_id=? ORDER BY session_no DESC").all(c.req.param("patientId")) });
});

sessions.post("/", async (c) => {
  const user = c.get("user") as any;
  const b = await c.req.json();
  if (!b.patientId || !b.date) return c.json({ error: "patientId and date required" }, 400);
  const last = db.prepare("SELECT MAX(session_no) as m FROM sessions WHERE patient_id=?").get(b.patientId) as any;
  const sessionNo = (last?.m || 0) + 1;
  const id = uid();
  db.prepare(`INSERT INTO sessions (id,patient_id,session_no,date,visit_type,clinician_id,clinician_name,duration,payment,payment_mode,pre_complaint,pre_pain,pre_mobility,pre_vitals,pre_notes,post_techniques,post_pain,post_response,post_notes,post_recommendation,followup,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    id, b.patientId, sessionNo, b.date, b.visitType||"IN-CLINIC", b.clinicianId||"", b.clinicianName||"",
    b.duration||0, b.payment||0, b.paymentMode||"CASH", b.pre?.complaint||"", b.pre?.pain||0, b.pre?.mobility||"",
    b.pre?.vitals||"", b.pre?.notes||"", b.post?.techniques||"", b.post?.pain||0, b.post?.response||"",
    b.post?.notes||"", b.post?.recommendation||"", b.followup||"", user.id, now(), now()
  );
  if (b.payment && parseFloat(b.payment) > 0) {
    db.prepare("INSERT INTO payments (id,patient_id,session_id,amount,mode,notes,recorded_by,created_at) VALUES (?,?,?,?,?,?,?,?)").run(uid(), b.patientId, id, b.payment, b.paymentMode||"CASH", `Session #${sessionNo}`, user.id, now());
  }
  audit("SESSION_CREATED", user.id, `Session #${sessionNo} for patient ${b.patientId}`);
  return c.json({ ok: true, id, sessionNo }, 201);
});

sessions.put("/:id", async (c) => {
  const user = c.get("user") as any;
  const b = await c.req.json();
  const sessionId = c.req.param("id");
  const session = db.prepare("SELECT * FROM sessions WHERE id=?").get(sessionId) as any;
  if (!session) return c.json({ error: "Session not found" }, 404);
  db.prepare(`UPDATE sessions SET
    date=?, visit_type=?, clinician_id=?, clinician_name=?, duration=?, payment=?, payment_mode=?,
    pre_complaint=?, pre_pain=?, pre_mobility=?, pre_vitals=?, pre_notes=?,
    post_techniques=?, post_pain=?, post_response=?, post_notes=?, post_recommendation=?, followup=?,
    updated_at=? WHERE id=?`).run(
    b.date, b.visitType||"IN-CLINIC", b.clinicianId||"", b.clinicianName||"", b.duration||0, b.payment||0, b.paymentMode||"CASH",
    b.pre?.complaint||"", b.pre?.pain??0, b.pre?.mobility||"", b.pre?.vitals||"", b.pre?.notes||"",
    b.post?.techniques||"", b.post?.pain??0, b.post?.response||"", b.post?.notes||"", b.post?.recommendation||"", b.followup||"",
    now(), sessionId
  );
  // Sync payment record when session payment changes
  if (b.payment != null) {
    const existingPayment = db.prepare("SELECT id FROM payments WHERE session_id=?").get(sessionId) as any;
    if (existingPayment) {
      if (parseFloat(b.payment) > 0) {
        db.prepare("UPDATE payments SET amount=?, mode=? WHERE session_id=?").run(b.payment, b.paymentMode||"CASH", sessionId);
      } else {
        db.prepare("DELETE FROM payments WHERE session_id=?").run(sessionId);
      }
    } else if (parseFloat(b.payment) > 0) {
      db.prepare("INSERT INTO payments (id,patient_id,session_id,amount,mode,notes,recorded_by,created_at) VALUES (?,?,?,?,?,?,?,?)").run(
        uid(), session.patient_id, sessionId, b.payment, b.paymentMode||"CASH", `Session #${session.session_no}`, user.id, now());
    }
  }
  audit("SESSION_UPDATED", user.id, `Updated session: ${sessionId}`);
  return c.json({ ok: true });
});

sessions.delete("/:id", async (c) => {
  const user = c.get("user") as any;
  if (user.role !== "ADMIN") return c.json({ error: "Only ADMIN can delete sessions" }, 403);
  const body = await c.req.json().catch(() => ({}));
  db.prepare("DELETE FROM sessions WHERE id=?").run(c.req.param("id"));
  db.prepare("DELETE FROM payments WHERE session_id=?").run(c.req.param("id"));
  audit("SESSION_DELETED", user.id, `Session deleted: ${c.req.param("id")}. Reason: ${body.reason||"none"}`);
  return c.json({ ok: true });
});

export default sessions;
