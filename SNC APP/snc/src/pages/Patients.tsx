import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { IconSearch, IconPlus } from "@tabler/icons-react";
import { api } from "@/lib/api";
import { usePermission } from "@/App";
import { onAppEvent, emitAppEvent } from "@/lib/appEvents";
import NoAccess from "@/components/NoAccess";

interface Patient {
  id: string;
  reg_no: string;
  name: string;
  age: string;
  sex: string;
  mobile: string;
  occupation: string;
  conditions: string[];
  restrictions: string[];
  active: boolean;
}

const CONDITIONS = ["Diabetes", "Heart", "BP", "Kidney", "B-12", "Folic Acid", "Tongue", "UDF"];
const RESTRICTIONS = ["Restriction", "No Khatta", "No Non-Veg", "No Alcohol"];

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [form, setForm] = useState({ name: "", regNo: "", age: "", sex: "Male", occupation: "", address: "", mobile: "", telephone: "", history: "" });
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);
  const { canView, canEdit } = usePermission('patients');

  const loadPatients = () => {
    setLoading(true);
    setLoadError(false);
    api<{ patients: Patient[] }>("/api/patients/")
      .then(data => setPatients(data.patients || []))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  // Stay fresh: reload if any page creates a patient elsewhere
  useEffect(() => {
    const cleanups = [
      onAppEvent("app:patients-changed", loadPatients),
    ];
    return () => cleanups.forEach(fn => fn());
  }, []);

  useEffect(() => { loadPatients(); }, []);

  const filtered = patients.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.reg_no || "").includes(search) || (p.mobile || "").includes(search)
  );

  const toggleCond = (c: string) => setSelectedConditions(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const toggleRest = (r: string) => setSelectedRestrictions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  const handleSave = async () => {
    if (!form.name || !form.mobile) { alert("Name and mobile required"); return; }
    try {
      const result = await api<{ ok: boolean; id: string; regNo: string }>("/api/patients/", {
        method: "POST",
        body: { name: form.name, regNo: form.regNo, age: form.age, sex: form.sex, occupation: form.occupation, address: form.address, mobile: form.mobile, telephone: form.telephone, history: form.history, conditions: selectedConditions, restrictions: selectedRestrictions },
      });
      setShowModal(false);
      setForm({ name: "", regNo: "", age: "", sex: "Male", occupation: "", address: "", mobile: "", telephone: "", history: "" });
      setSelectedConditions([]);
      setSelectedRestrictions([]);
      loadPatients();
      emitAppEvent("app:patients-changed");
    } catch (err) {
      alert("Failed to save patient");
    }
  };

  if (!canView) return <NoAccess message="Access Restricted" detail="You do not have permission to view patients." />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Syne'] text-xl font-extrabold text-[#0d4a2c]">Patient Records</h1>
          <p className="text-sm text-[#6b8878] mt-1">{loading ? "..." : `${patients.length} registered patients`}</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b8878]" />
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-[#cfe0d8] rounded-lg text-sm w-64 focus:outline-none focus:border-[#1a7a4a]" />
          </div>
          {canEdit && (
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1a7a4a] hover:bg-[#0d4a2c] text-white font-semibold rounded-lg transition-colors">
              <IconPlus className="w-4 h-4" /> Add Patient
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#cfe0d8] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f0f7f4]">
              <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Reg No</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Patient</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Age/Sex</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Mobile</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Conditions</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Status</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12"><div className="h-6 w-24 mx-auto bg-[#f0f7f4] rounded animate-pulse" /></td></tr>
            ) : loadError ? (
              <tr><td colSpan={7} className="text-center py-12 text-[#6b8878]">
                <div className="text-4xl mb-2">⚠️</div><div className="font-medium">Failed to load patients</div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-[#6b8878]">
                <div className="text-4xl mb-2">👤</div><div className="font-medium">No patients found</div>
              </td></tr>
            ) : filtered.map(p => {
              const conds = Array.isArray(p.conditions) ? p.conditions : JSON.parse(p.conditions || "[]");
              return (
                <tr key={p.id} className="border-t border-[#cfe0d8] hover:bg-[#f0f7f4] cursor-pointer transition-colors">
                  <td className="px-4 py-3"><strong className="text-sm">{p.reg_no || "—"}</strong></td>
                  <td className="px-4 py-3"><div className="font-semibold text-sm">{p.name}</div><div className="text-xs text-[#6b8878]">{p.occupation || "—"}</div></td>
                  <td className="px-4 py-3 text-sm">{p.age}/{p.sex?.[0] || "?"}</td>
                  <td className="px-4 py-3 text-sm">{p.mobile}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {conds.slice(0, 3).map((c: string) => <span key={c} className="px-2 py-0.5 bg-[#dbeafe] text-[#2563eb] rounded-full text-[11px] font-bold">{c}</span>)}
                      {conds.length > 3 && <span className="px-2 py-0.5 bg-[#f3f4f6] text-[#6b7280] rounded-full text-[11px]">+{conds.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${p.active ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#f3f4f6] text-[#6b7280]"}`}>{p.active ? "Active" : "Inactive"}</span>
                  </td>
                  <td className="px-4 py-3">
                    {canView && (
                      <Link to={`/patients/${p.id}`} className="px-3 py-1 border border-[#1a7a4a] text-[#1a7a4a] font-semibold rounded-lg text-xs hover:bg-[#d4ede1] transition-colors">View</Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 border-b border-[#cfe0d8] flex items-center justify-between">
              <h2 className="font-['Syne'] text-base font-extrabold text-[#0d4a2c]">👤 Patient Registration</h2>
              <button onClick={() => setShowModal(false)} className="text-xl text-[#6b8878] hover:text-[#1a2e24]">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold mb-1.5">Full Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" placeholder="Patient name" /></div>
                <div><label className="block text-sm font-semibold mb-1.5">Registration No</label>
                  <input value={form.regNo} onChange={e => setForm({...form, regNo: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" placeholder="Auto" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-semibold mb-1.5">Age *</label>
                  <input type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" placeholder="Age" /></div>
                <div><label className="block text-sm font-semibold mb-1.5">Sex *</label>
                  <select value={form.sex} onChange={e => setForm({...form, sex: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]">
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select></div>
                <div><label className="block text-sm font-semibold mb-1.5">Occupation</label>
                  <input value={form.occupation} onChange={e => setForm({...form, occupation: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" placeholder="Occupation" /></div>
              </div>
              <div><label className="block text-sm font-semibold mb-1.5">Address</label>
                <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows={2}
                  className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a] resize-none" placeholder="Full address" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold mb-1.5">Mobile *</label>
                  <input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" placeholder="Mobile" /></div>
                <div><label className="block text-sm font-semibold mb-1.5">Telephone</label>
                  <input value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" placeholder="Alternate" /></div>
              </div>
              <div className="border-t border-[#cfe0d8] pt-4">
                <label className="block text-sm font-bold mb-2">Conditions</label>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map(c => (
                    <button key={c} type="button" onClick={() => toggleCond(c)}
                      className={`px-3 py-1.5 border rounded-full text-sm font-medium transition-all ${selectedConditions.includes(c) ? "bg-[#d4ede1] border-[#1a7a4a] text-[#1a7a4a]" : "border-[#cfe0d8] text-[#6b8878]"}`}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Dietary Restrictions</label>
                <div className="flex flex-wrap gap-2">
                  {RESTRICTIONS.map(r => (
                    <button key={r} type="button" onClick={() => toggleRest(r)}
                      className={`px-3 py-1.5 border rounded-full text-sm font-medium transition-all ${selectedRestrictions.includes(r) ? "bg-[#d4ede1] border-[#1a7a4a] text-[#1a7a4a]" : "border-[#cfe0d8] text-[#6b8878]"}`}>{r}</button>
                  ))}
                </div>
              </div>
              <div><label className="block text-sm font-semibold mb-1.5">Patient History</label>
                <textarea value={form.history} onChange={e => setForm({...form, history: e.target.value})} rows={3}
                  className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a] resize-none" placeholder="Medical history..." /></div>
            </div>
            <div className="px-6 py-4 border-t border-[#cfe0d8] flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#cfe0d8] text-[#6b8878] font-semibold rounded-lg hover:bg-[#f0f7f4]">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-[#1a7a4a] hover:bg-[#0d4a2c] text-white font-semibold rounded-lg">💾 Save Patient</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}