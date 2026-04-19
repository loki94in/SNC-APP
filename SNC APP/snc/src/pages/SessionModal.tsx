import { useState } from "react";
import { api } from "@/lib/api";

interface SessionModalProps {
  patientId: string;
  onClose: () => void;
}

export default function SessionModal({ patientId, onClose }: SessionModalProps) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    visitType: "IN-CLINIC",
    duration: "",
    payment: "",
    paymentMode: "CASH",
    preComplaint: "",
    prePain: 5,
    preMobility: "NORMAL",
    preVitals: "",
    preNotes: "",
    postTechniques: "",
    postPain: 5,
    postResponse: "GOOD",
    postNotes: "",
    postRecommendation: "",
    followup: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!form.date) { setError("Date is required"); return; }
    setSaving(true);
    setError("");
    try {
      await api("/api/sessions/", {
        method: "POST",
        body: {
          patientId,
          date: form.date,
          visitType: form.visitType,
          duration: form.duration,
          payment: form.payment,
          paymentMode: form.paymentMode,
          pre: {
            complaint: form.preComplaint,
            pain: form.prePain,
            mobility: form.preMobility,
            vitals: form.preVitals,
            notes: form.preNotes,
          },
          post: {
            techniques: form.postTechniques,
            pain: form.postPain,
            response: form.postResponse,
            notes: form.postNotes,
            recommendation: form.postRecommendation,
          },
          followup: form.followup,
        },
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save session");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-4 border-b border-[#cfe0d8] flex items-center justify-between">
          <h2 className="font-['Syne'] text-base font-extrabold text-[#0d4a2c]">&#129524; Add Session</h2>
          <button onClick={onClose} className="text-xl text-[#6b8878]">&#10005;</button>
        </div>

        {error && <div className="mx-6 mt-4 px-4 py-2 bg-[#fee2e2] text-[#dc2626] rounded-lg text-sm">{error}</div>}

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Date *</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Visit Type</label>
              <select value={form.visitType} onChange={e => setForm({...form, visitType: e.target.value})}
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]">
                <option value="IN-CLINIC">In-Clinic</option>
                <option value="HOME">Home Visit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Payment (&#8377;)</label>
              <input type="number" value={form.payment} onChange={e => setForm({...form, payment: e.target.value})}
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Mode</label>
              <select value={form.paymentMode} onChange={e => setForm({...form, paymentMode: e.target.value})}
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]">
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">Chief Complaint</label>
            <textarea value={form.preComplaint} onChange={e => setForm({...form, preComplaint: e.target.value})} rows={2}
              className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a] resize-none" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">Pre Pain Level: {form.prePain}/10</label>
            <input type="range" min="0" max="10" value={form.prePain}
              onChange={e => setForm({...form, prePain: parseInt(e.target.value)})}
              className="w-full accent-[#1a7a4a]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Mobility</label>
              <select value={form.preMobility} onChange={e => setForm({...form, preMobility: e.target.value})}
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]">
                <option value="NORMAL">Normal</option>
                <option value="RESTRICTED">Restricted</option>
                <option value="BEDRIDDEN">Bedridden</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Vitals (BP, Pulse)</label>
              <input value={form.preVitals} onChange={e => setForm({...form, preVitals: e.target.value})}
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" placeholder="e.g. 120/80, 72 bpm" />
            </div>
          </div>

          <div className="border-t border-[#cfe0d8] pt-4">
            <label className="block text-sm font-semibold mb-1.5">Techniques Applied</label>
            <input value={form.postTechniques} onChange={e => setForm({...form, postTechniques: e.target.value})}
              className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" placeholder="e.g. Spinal Manipulation, Acupressure" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Patient Response</label>
              <select value={form.postResponse} onChange={e => setForm({...form, postResponse: e.target.value})}
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]">
                <option value="VERY GOOD">Very Good</option>
                <option value="GOOD">Good</option>
                <option value="NEUTRAL">Neutral</option>
                <option value="POOR">Poor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Post Pain Level: {form.postPain}/10</label>
              <input type="range" min="0" max="10" value={form.postPain}
                onChange={e => setForm({...form, postPain: parseInt(e.target.value)})}
                className="w-full accent-[#1a7a4a]" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">Clinician Notes</label>
            <textarea value={form.postNotes} onChange={e => setForm({...form, postNotes: e.target.value})} rows={2}
              className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a] resize-none" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">Next Session Recommendation</label>
            <textarea value={form.postRecommendation} onChange={e => setForm({...form, postRecommendation: e.target.value})} rows={2}
              className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a] resize-none" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">Follow-up Date</label>
            <input type="date" value={form.followup} onChange={e => setForm({...form, followup: e.target.value})}
              className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#cfe0d8] flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-[#cfe0d8] text-[#6b8878] font-semibold rounded-lg hover:bg-[#f0f7f4]" disabled={saving}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg hover:bg-[#0d4a2c] disabled:opacity-50">
            {saving ? "Saving..." : "Save Session"}
          </button>
        </div>
      </div>
    </div>
  );
}
