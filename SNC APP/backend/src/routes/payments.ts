import { Hono } from "hono";
import { db, now } from "../db.js";
import { v4 as uid } from "uuid";
import { audit } from "../audit.js";
const payments = new Hono();
payments.get("/", async (c) => {
  const patientId = c.req.query("patientId");
  const dateFrom = c.req.query("from");
  const dateTo = c.req.query("to");
  let q = "SELECT p.*, pt.name as patient_name FROM payments p LEFT JOIN patients pt ON p.patient_id=pt.id WHERE 1=1";
  const a: any[] = [];
  if (patientId) { q += " AND p.patient_id=?"; a.push(patientId); }
  if (dateFrom) { q += " AND p.created_at>=?"; a.push(dateFrom); }
  if (dateTo) { q += " AND p.created_at<=?"; a.push(dateTo); }
  q += " ORDER BY p.created_at DESC";
  return c.json({ payments: db.prepare(q).all(...a) });
});
payments.post("/", async (c) => {
  const user = c.get("user") as any;
  const b = await c.req.json();
  const id = uid();
  db.prepare("INSERT INTO payments (id,patient_id,session_id,amount,mode,notes,recorded_by,created_at) VALUES (?,?,?,?,?,?,?,?)").run(id, b.patientId, b.sessionId||null, b.amount, b.mode||"CASH", b.notes||"", user.id, now());
  audit("PAYMENT_RECORDED", user.id, `Payment ${b.amount} for patient ${b.patientId}`);
  return c.json({ ok: true, id }, 201);
});
export default payments;
