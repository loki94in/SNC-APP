import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { IconArrowLeft, IconPlus } from "@tabler/icons-react";

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("info");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const patients = JSON.parse(localStorage.getItem("snc_patients") || "[]");
    setPatient(patients.find((p: any) => p.id === id));
    const allSessions = JSON.parse(localStorage.getItem("snc_sessions") || "[]");
    setSessions(allSessions.filter((s: any) => s.patientId === id).sort((a: any, b: any) => b.sessionNo - a.sessionNo));
  }, [id]);

  if (!patient) return <div className="text-center py-12">Patient not found</div>;

  const initials = patient.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "??";

  return (
    <div className="space-y-5">
      <Link to="/patients" className="inline-flex items-center gap-2 text-sm text-[#6b8878] hover:text-[#1a7a4a]">
        <IconArrowLeft className="w-4 h-4" /> Back to Patients
      </Link>

      <div className="bg-white rounded-xl border border-[#cfe0d8] p-5 flex items-center gap-4">
        <div className="w-14 h-14 bg-[#e8a020] rounded-full flex items-center justify-center font-extrabold text-lg text-[#0d4a2c]">{initials}</div>
        <div className="flex-1">
          <h1 className="font-['Syne'] text-xl font-extrabold text-[#0d4a2c]">{patient.name}</h1>
          <div className="text-sm text-[#6b8878] mt-1">Reg: {patient.regNo} • {patient.age}/{patient.sex?.[0]} • 📞 {patient.mobile}</div>
          <div className="flex gap-2 mt-2">
            {(patient.conditions || []).map((c: string) => <span key={c} className="px-2 py-0.5 bg-[#fef3c7] text-[#d97706] rounded text-xs font-bold">⚠️ {c}</span>)}
            {(patient.restrictions || []).map((r: string) => <span key={r} className="px-2 py-0.5 bg-[#fee2e2] text-[#dc2626] rounded text-xs font-bold">🚫 {r}</span>)}
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#e8a020] text-[#0d4a2c] font-semibold rounded-lg">
          <IconPlus className="w-4 h-4" /> Add Session
        </button>
      </div>

      <div className="flex gap-2 border-b-2 border-[#cfe0d8] mb-5">
        {["info", "sessions", "regular"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${activeTab === tab ? "text-[#1a7a4a] border-[#1a7a4a]" : "text-[#6b8878] border-transparent"}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "info" && (
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-[#cfe0d8] p-5">
            <h3 className="font-bold text-sm mb-3 text-[#6b8878] uppercase">Contact</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-[#6b8878]">Address:</span> {patient.address || "—"}</div>
              <div><span className="text-[#6b8878]">Mobile:</span> {patient.mobile}</div>
              <div><span className="text-[#6b8878]">Telephone:</span> {patient.telephone || "—"}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#cfe0d8] p-5">
            <h3 className="font-bold text-sm mb-3 text-[#6b8878] uppercase">Medical Notes</h3>
            <div className="text-sm whitespace-pre-wrap">{patient.history || "No history recorded."}</div>
          </div>
        </div>
      )}

      {activeTab === "sessions" && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#cfe0d8] p-12 text-center">
              <div className="text-4xl mb-2">🩺</div>
              <div className="font-medium text-[#6b8878]">No sessions yet</div>
            </div>
          ) : sessions.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-[#cfe0d8] p-5">
              <div className="flex items-center justify-between mb-3">
                <div><span className="font-bold text-lg">#{s.sessionNo}</span> <span className="ml-3 text-sm text-[#6b8878]">{s.date}</span></div>
                <span className="font-bold text-[#1a7a4a]">₹{s.payment || 0}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-[#fef3c7] rounded-lg">
                  <div className="font-bold text-xs text-[#d97706] mb-2">📋 PRE</div>
                  <div>Pain: {s.pre?.pain ?? "—"}/10</div>
                </div>
                <div className="p-3 bg-[#dcfce7] rounded-lg">
                  <div className="font-bold text-xs text-[#16a34a] mb-2">✅ POST</div>
                  <div>Response: {s.post?.response || "—"}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "regular" && (
        <div className="bg-white rounded-xl border border-[#cfe0d8] p-12 text-center">
          <div className="text-4xl mb-2">📅</div>
          <div className="text-[#6b8878]">Regular Visit Plan</div>
        </div>
      )}

      {showModal && <SessionModal patientId={id!} onClose={() => setShowModal(false)} />}
    </div>
  );
}

function SessionModal({ patientId, onClose }: { patientId: string; onClose: () => void }) {
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], visitType: "IN-CLINIC", duration: "", payment: "", paymentMode: "CASH", preComplaint: "", prePain: 5, postResp: "GOOD", postNotes: "" });

  const handleSave = () => {
    const sessions = JSON.parse(localStorage.getItem("snc_sessions") || "[]");
    const patientSessions = sessions.filter((s: any) => s.patientId === patientId);
    const newSession: any = {
      id: Math.random().toString(36).slice(2), patientId, sessionNo: patientSessions.length + 1,
      date: form.date, visitType: form.visitType, duration: form.duration, payment: parseInt(form.payment) || 0, paymentMode: form.paymentMode,
      pre: { complaint: form.preComplaint, pain: form.prePain },
      post: { response: form.postResp, notes: form.postNotes },
    };
    localStorage.setItem("snc_sessions", JSON.stringify([...sessions, newSession]));
    if (newSession.payment > 0) {
      const payments = JSON.parse(localStorage.getItem("snc_payments") || "[]");
      payments.push({ id: Math.random().toString(36).slice(2), patientId, sessionId: newSession.id, date: form.date, amount: newSession.payment, mode: form.paymentMode });
      localStorage.setItem("snc_payments", JSON.stringify(payments));
    }
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-4 border-b border-[#cfe0d8] flex items-center justify-between">
          <h2 className="font-['Syne'] text-base font-extrabold text-[#0d4a2c]">🩺 Add Session</h2>
          <button onClick={onClose} className="text-xl text-[#6b8878]">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold mb-1.5">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" /></div>
            <div><label className="block text-sm font-semibold mb-1.5">Visit Type</label>
              <select value={form.visitType} onChange={e => setForm({...form, visitType: e.target.value})}
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]">
                <option value="IN-CLINIC">In-Clinic</option><option value="HOME">Home Visit</option>
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold mb-1.5">Payment (₹)</label>
              <input type="number" value={form.payment} onChange={e => setForm({...form, payment: e.target.value})}
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" placeholder="0" /></div>
            <div><label className="block text-sm font-semibold mb-1.5">Mode</label>
              <select value={form.paymentMode} onChange={e => setForm({...form, paymentMode: e.target.value})}
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]">
                <option value="CASH">Cash</option><option value="UPI">UPI</option><option value="PENDING">Pending</option>
              </select></div>
          </div>
          <div><label className="block text-sm font-semibold mb-1.5">Chief Complaint</label>
            <textarea value={form.preComplaint} onChange={e => setForm({...form, preComplaint: e.target.value})} rows={2}
              className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a] resize-none" /></div>
          <div><label className="block text-sm font-semibold mb-1.5">Pain Level: {form.prePain}/10</label>
            <input type="range" min="0" max="10" value={form.prePain} onChange={e => setForm({...form, prePain: parseInt(e.target.value)})}
              className="w-full accent-[#1a7a4a]" /></div>
          <div><label className="block text-sm font-semibold mb-1.5">Response</label>
            <select value={form.postResp} onChange={e => setForm({...form, postResp: e.target.value})}
              className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]">
              <option value="VERY GOOD">Very Good</option><option value="GOOD">Good</option><option value="NEUTRAL">Neutral</option><option value="POOR">Poor</option>
            </select></div>
        </div>
        <div className="px-6 py-4 border-t border-[#cfe0d8] flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-[#cfe0d8] text-[#6b8878] font-semibold rounded-lg">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg">Save Session</button>
        </div>
      </div>
    </div>
  );
}
