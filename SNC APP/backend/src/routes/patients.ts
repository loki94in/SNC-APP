import { Hono } from "hono";
import { db, now } from "../db.js";
import { v4 as uid } from "uuid";
import { audit } from "../audit.js";

const patients = new Hono();

// GET /api/patients → list all
patients.get("/", async (c) => {
  const rows = db.prepare("SELECT * FROM patients WHERE active=1 ORDER BY created_at DESC").all() as any[];
  const result = rows.map(r => ({
    id: r.id, regNo: r.reg_no, name: r.name, age: r.age, sex: r.sex,
    occupation: r.occupation, address: r.address, mobile: r.mobile,
    telephone: r.telephone || "", conditions: safeJson(r.conditions, []),
    restrictions: safeJson(r.restrictions, []), history: r.history || "",
    active: r.active === 1, createdAt: r.created_at
  }));
  return c.json({ patients: result });
});

// GET /api/patients/:id
patients.get("/:id", async (c) => {
  const r = db.prepare("SELECT * FROM patients WHERE id=?").get(c.req.param("id")) as any;
  if (!r) return c.json({ error: "Not found" }, 404);
  return c.json({
    id: r.id, regNo: r.reg_no, name: r.name, age: r.age, sex: r.sex,
    occupation: r.occupation, address: r.address, mobile: r.mobile,
    telephone: r.telephone || "", conditions: safeJson(r.conditions, []),
    restrictions: safeJson(r.restrictions, []), history: r.history || "",
    active: r.active === 1, createdAt: r.created_at
  });
});

// POST /api/patients
patients.post("/", async (c) => {
  const user = c.get("user") as any;
  const b = await c.req.json();
  if (!b.name || !b.mobile) return c.json({ error: "name and mobile required" }, 400);
  const allPatients = db.prepare("SELECT * FROM patients").all() as any[];
  const regNo = b.regNo || "SNC" + String(allPatients.length + 1).padStart(4, "0");
  const id = uid();
  db.prepare(`INSERT INTO patients (id,reg_no,name,age,sex,occupation,address,mobile,telephone,conditions,restrictions,history,active,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)`).run(
    id, regNo, b.name, b.age||"", b.sex||"Male", b.occupation||"",
    b.address||"", b.mobile, b.telephone||"",
    JSON.stringify(b.conditions||[]), JSON.stringify(b.restrictions||[]),
    b.history||"", now(), now()
  );
  audit("PATIENT_CREATED", user.id, `Patient registered: ${b.name} (${regNo})`);
  return c.json({ ok: true, id, regNo }, 201);
});

// PATCH /api/patients/:id
patients.patch("/:id", async (c) => {
  const user = c.get("user") as any;
  const b = await c.req.json();
  const existing = db.prepare("SELECT id FROM patients WHERE id=?").get(c.req.param("id"));
  if (!existing) return c.json({ error: "Not found" }, 404);
  const fields = [];
  const vals = [];
  const map: Record<string, string> = { name:"name", age:"age", sex:"sex", occupation:"occupation", address:"address", mobile:"mobile", telephone:"telephone", history:"history", active:"active" };
  for (const [k, col] of Object.entries(map)) {
    if (b[k] !== undefined) { fields.push(`${col}=?`); vals.push(b[k]); }
  }
  if (b.conditions) { fields.push("conditions=?"); vals.push(JSON.stringify(b.conditions)); }
  if (b.restrictions) { fields.push("restrictions=?"); vals.push(JSON.stringify(b.restrictions)); }
  if (!fields.length) return c.json({ error: "No fields to update" }, 400);
  fields.push("updated_at=?"); vals.push(now());
  vals.push(c.req.param("id"));
  db.prepare(`UPDATE patients SET ${fields.join(",")} WHERE id=?`).run(...vals);
  audit("PATIENT_UPDATED", user.id, `Patient updated: ${c.req.param("id")}`);
  return c.json({ ok: true });
});

// DELETE /api/patients/:id (soft delete)
patients.delete("/:id", async (c) => {
  const user = c.get("user") as any;
  if (user.role !== "ADMIN") return c.json({ error: "Forbidden" }, 403);
  db.prepare("UPDATE patients SET active=0, updated_at=? WHERE id=?").run(now(), c.req.param("id"));
  audit("PATIENT_DELETED", user.id, `Patient deleted: ${c.req.param("id")}`);
  return c.json({ ok: true });
});

function safeJson(str: string | null, fallback: any): any {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

export default patients;
