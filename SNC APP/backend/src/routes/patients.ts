import { Hono } from "hono";
import { db, now } from "../db.js";
import { v4 as uid } from "uuid";
import { audit } from "../audit.js";

const patients = new Hono();

patients.get("/", async (c) => {
  const search = c.req.query("search") || "";
  let rows = db.prepare("SELECT * FROM patients WHERE active=1 ORDER BY created_at DESC").all() as any[];
  if (search) rows = rows.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.reg_no||"").toLowerCase().includes(search.toLowerCase()) ||
    (p.mobile||"").includes(search)
  );
  return c.json({ patients: rows });
});

patients.get("/:id", async (c) => {
  const pt = db.prepare("SELECT * FROM patients WHERE id=?").get(c.req.param("id"));
  if (!pt) return c.json({ error: "Not found" }, 404);
  return c.json({ patient: pt });
});

patients.post("/", async (c) => {
  const user = c.get("user") as any;
  const b = await c.req.json();
  if (!b.name || !b.mobile) return c.json({ error: "Name and mobile required" }, 400);
  const id = uid();
  const regNo = b.regNo || "SNC" + String(Date.now()).slice(-6);
  db.prepare(`INSERT INTO patients (id,reg_no,name,age,sex,occupation,address,mobile,telephone,conditions,restrictions,history,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)`).run(
    id, regNo, b.name, b.age||"", b.sex||"", b.occupation||"", b.address||"", b.mobile, b.telephone||"",
    JSON.stringify(b.conditions||[]), JSON.stringify(b.restrictions||[]), b.history||"", now(), now()
  );
  audit("PATIENT_CREATED", user.id, `Created patient: ${b.name} (${regNo})`);
  return c.json({ ok: true, id, regNo }, 201);
});

patients.put("/:id", async (c) => {
  const user = c.get("user") as any;
  const b = await c.req.json();
  db.prepare(`UPDATE patients SET name=?,age=?,sex=?,occupation=?,address=?,mobile=?,telephone=?,conditions=?,restrictions=?,history=?,updated_at=? WHERE id=?`
  ).run(b.name, b.age||"", b.sex||"", b.occupation||"", b.address||"", b.mobile, b.telephone||"",
      JSON.stringify(b.conditions||[]), JSON.stringify(b.restrictions||[]), b.history||"", now(), c.req.param("id"));
  audit("PATIENT_UPDATED", user.id, `Updated patient: ${c.req.param("id")}`);
  return c.json({ ok: true });
});

patients.delete("/:id", async (c) => {
  const user = c.get("user") as any;
  if (user.role !== "ADMIN") return c.json({ error: "Forbidden" }, 403);
  db.prepare("UPDATE patients SET active=0, updated_at=? WHERE id=?").run(now(), c.req.param("id"));
  audit("PATIENT_DELETED", user.id, `Soft-deleted patient: ${c.req.param("id")}`);
  return c.json({ ok: true });
});

export default patients;
