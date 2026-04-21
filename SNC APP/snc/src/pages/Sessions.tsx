import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { usePermission } from "@/App";
import { onAppEvent, emitAppEvent } from "@/lib/appEvents";
import NoAccess from "@/components/NoAccess";

interface Session {
  id: string;
  patient_id: string;
  patient_name?: string;
  session_no: number;
  date: string;
  visit_type: string;
  clinician_id: string;
  clinician_name: string;
  duration: number;
  payment: number;
  payment_mode: string;
  pre_complaint: string;
  pre_pain: number;
  pre_mobility: string;
  pre_vitals: string;
  pre_notes: string;
  post_techniques: string;
  post_pain: number;
  post_response: string;
  post_notes: string;
  post_recommendation: string;
  followup: string;
}

function DataError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-[#fee2e2] p-8 text-center">
      <div className="text-3xl mb-2">⚠️</div>
      <div className="font-semibold text-[#dc2626] mb-1">Failed to load sessions</div>
      <div className="text-sm text-[#6b8878] mb-4">Could not reach the server. Check your connection.</div>
      <button onClick={onRetry} className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg hover:bg-[#0d4a2c] text-sm">
        Try Again
      </button>
    </div>
  );
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [saving, setSaving] = useState(false);
  const { canView, canEdit } = usePermission("sessions");

  const loadSessions = () => {
    setLoading(true);
    setLoadError(false);
    api<{ sessions: Session[] }>("/api/sessions/")
      .then(data => setSessions(data.sessions || []))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const cleanups = [onAppEvent("app:sessions-changed", loadSessions)];
    return () => cleanups.forEach(fn => fn());
  }, []);

  useEffect(() => { loadSessions(); }, []);

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
  };

  const handleDeleteSession = (session: Session) => {
    setDeleteTarget(session);
    setDeleteReason("");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api(`/api/sessions/${deleteTarget.id}`, {
        method: "DELETE",
        body: { reason: deleteReason },
      });
      setDeleteTarget(null);
      loadSessions();
      emitAppEvent("app:sessions-changed");
    } catch (err: any) {
      alert(err.message || "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  if (!canView) return <NoAccess message="Access Restricted" detail="You do not have permission to view sessions." />;

  const sessionCount = sessions.length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-['Syne'] text-xl font-extrabold text-[#0d4a2c]">Sessions</h1>
        <p className="text-sm text-[#6b8878] mt-1">
          {loading ? "..." : loadError ? "Load failed" : `${sessionCount} total session${sessionCount !== 1 ? "s" : ""}`}
        </p>
      </div>

      {loadError ? (
        <DataError onRetry={loadSessions} />
      ) : (
        <div className="bg-white rounded-xl border border-[#cfe0d8] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f0f7f4]">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">#</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Patient</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Date</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Type</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Response</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Amount</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12"><div className="h-6 w-32 mx-auto bg-[#f0f7f4] rounded animate-pulse" /></td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-[#6b8878]">
                  <div className="text-4xl mb-2">🩺</div>
                  <div className="font-medium">No sessions recorded yet</div>
                  <div className="text-sm mt-1">Add a session from a patient profile to get started.</div>
                </td></tr>
              ) : sessions.map(s => (
                <tr key={s.id} className="border-t border-[#cfe0d8] hover:bg-[#f0f7f4] transition-colors">
                  <td className="px-4 py-3"><strong>#{s.session_no}</strong></td>
                  <td className="px-4 py-3 font-semibold text-sm">{s.patient_name || s.patient_id}</td>
                  <td className="px-4 py-3 text-sm">{s.date}</td>
                  <td className="px-4 py-3 text-sm">{s.visit_type === "HOME" ? "🏠 Home" : "🏥 Clinic"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      s.post_response === "VERY_GOOD" || s.post_response === "GOOD" ? "bg-[#dcfce7] text-[#16a34a]"
                      : s.post_response === "POOR" ? "bg-[#fee2e2] text-[#dc2626]"
                      : "bg-[#f3f4f6] text-[#6b7280]"
                    }`}>
                      {s.post_response || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-[#1a7a4a]">₹{s.payment || 0}</td>
                  <td className="px-4 py-3">
                    {canEdit && (
                      <div className="flex gap-2">
                        <button onClick={() => handleEditSession(s)}
                          className="px-2 py-1 border border-[#1a7a4a] text-[#1a7a4a] font-semibold rounded-lg text-xs hover:bg-[#d4ede1] transition-colors"
                        >Edit</button>
                        <button onClick={() => handleDeleteSession(s)}
                          className="px-2 py-1 border border-[#dc2626] text-[#dc2626] font-semibold rounded-lg text-xs hover:bg-[#fee2e2] transition-colors"
                        >Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Session Modal */}
      {editingSession && (
        <SessionEditModal
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSaved={() => {
            setEditingSession(null);
            loadSessions();
            emitAppEvent("app:sessions-changed");
            emitAppEvent("app:payments-changed");
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-[#cfe0d8]">
              <h2 className="font-['Syne'] text-base font-extrabold text-[#dc2626]">Delete Session #{deleteTarget.session_no}</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#6b8878]">This will permanently delete this session and its associated payment record. This action cannot be undone.</p>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Reason for deletion (optional)</label>
                <textarea
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a] resize-none"
                  placeholder="e.g. Double entry, patient refund issued..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#cfe0d8] flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-[#cfe0d8] text-[#6b8878] font-semibold rounded-lg hover:bg-[#f0f7f4]"
                disabled={saving}>Cancel</button>
              <button onClick={confirmDelete} disabled={saving}
                className="px-4 py-2 bg-[#dc2626] text-white font-semibold rounded-lg hover:bg-[#b91c1c] disabled:opacity-50">
                {saving ? "Deleting..." : "Delete Session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Edit Session Modal ─────────────────────────────────────────────────────

interface SessionEditModalProps {
  session: Session;
  onClose: () => void;
  onSaved: () => void;
}

function SessionEditModal({ session, onClose, onSaved }: SessionEditModalProps) {
  const [form, setForm] = useState({
    date: session.date,
    visitType: session.visit_type || "IN-CLINIC",
    clinicianName: session.clinician_name || "",
    duration: String(session.duration || ""),
    payment: String(session.payment || ""),
    paymentMode: session.payment_mode || "CASH",
    preComplaint: session.pre_complaint || "",
    prePain: session.pre_pain ?? 0,
    preMobility: session.pre_mobility || "Normal",
    preVitals: session.pre_vitals || "",
    preNotes: session.pre_notes || "",
    postTechniques: session.post_techniques || "",
    postPain: session.post_pain ?? 0,
    postResponse: session.post_response || "GOOD",
    postNotes: session.post_notes || "",
    postRecommendation: session.post_recommendation || "",
    followup: session.followup || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: string) => (e: any) =>
    setForm((prev: any) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.date) { setError("Date is required"); return; }
    setSaving(true);
    setError(null);
    try {
      await api(`/api/sessions/${session.id}`, {
        method: "PUT",
        body: {
          date: form.date,
          visitType: form.visitType,
          clinicianName: form.clinicianName,
          duration: form.duration ? parseInt(form.duration) : 0,
          payment: form.payment ? parseFloat(form.payment) : 0,
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
      onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to update session");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-4 border-b border-[#cfe0d8] flex items-center justify-between">
          <h2 className="font-['Syne'] text-base font-extrabold text-[#0d4a2c]">Edit Session #{session.session_no}</h2>
          <button onClick={onClose} className="text-xl text-[#6b8878] hover:text-[#1a2e24]">✕</button>
        </div>
        <div className="p-6 space-y-5">
          {error && <div className="text-sm text-[#dc2626] bg-[#fee2e2] px-4 py-2 rounded-lg">{error}</div>}

          {/* Row 1: Date + Visit Type + Duration */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Date *</label>
              <input type="date" value={form.date}
                onChange={set("date")}
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Visit Type</label>
              <select value={form.visitType} onChange={set("visitType")}
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]">
                <option value="IN-CLINIC">In-Clinic</option>
                <option value="HOME">Home Visit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Duration (min)</label>
              <input type="number" value={form.duration}
                onChange={set("duration")}
                placeholder="e.g. 45"
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" />
            </div>
          </div>

          {/* Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Payment (₹)</label>
              <input type="number" value={form.payment}
                onChange={set("payment")}
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]"
                placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Payment Mode</label>
              <select value={form.paymentMode} onChange={set("paymentMode")}
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]">
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>

          {/* Pre-Treatment */}
          <div className="border-t-2 border-[#fef3c7] pt-4">
            <div className="text-xs font-bold text-[#d97706] uppercase tracking-wide mb-3">📋 Pre-Treatment</div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Chief Complaint</label>
                <textarea value={form.preComplaint} onChange={set("preComplaint")} rows={2}
                  placeholder="Patient's main issue before session..."
                  className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a] resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Pain Level: {form.prePain}/10</label>
                <input type="range" min="0" max="10" value={form.prePain}
                  onChange={e => setForm((_: any) => ({ ..._, prePain: parseInt(e.target.value) }))}
                  className="w-full accent-[#d97706]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Mobility</label>
                  <select value={form.preMobility} onChange={set("preMobility")}
                    className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]">
                    <option>Normal</option><option>Restricted</option><option>Bedridden</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">BP / Pulse</label>
                  <input value={form.preVitals} onChange={set("preVitals")} placeholder="e.g. 120/80"
                    className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" />
                </div>
              </div>
            </div>
          </div>

          {/* Post-Treatment */}
          <div className="border-t-2 border-[#dcfce7] pt-4">
            <div className="text-xs font-bold text-[#16a34a] uppercase tracking-wide mb-3">✅ Post-Treatment</div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Techniques Applied</label>
                <input value={form.postTechniques} onChange={set("postTechniques")}
                  placeholder="e.g. Spinal manipulation, Acupressure..."
                  className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Post Pain: {form.postPain}/10</label>
                <input type="range" min="0" max="10" value={form.postPain}
                  onChange={e => setForm(prev => ({ ...prev, postPain: parseInt(e.target.value) }))}
                  className="w-full accent-[#16a34a]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Response</label>
                  <select value={form.postResponse} onChange={set("postResponse")}
                    className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]">
                    <option value="VERY_GOOD">Very Good</option>
                    <option value="GOOD">Good</option>
                    <option value="NEUTRAL">Neutral</option>
                    <option value="POOR">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Follow-up Date</label>
                  <input type="date" value={form.followup} onChange={set("followup")}
                    className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Post-Notes</label>
                <textarea value={form.postNotes} onChange={set("postNotes")} rows={2}
                  placeholder="Outcome observations..."
                  className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a] resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Recommendation</label>
                <textarea value={form.postRecommendation} onChange={set("postRecommendation")} rows={2}
                  placeholder="What to do next time..."
                  className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a] resize-none" />
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#cfe0d8] flex gap-3 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 border border-[#cfe0d8] text-[#6b8878] font-semibold rounded-lg hover:bg-[#f0f7f4]"
            disabled={saving}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg hover:bg-[#0d4a2c] disabled:opacity-50">
            {saving ? "Saving..." : "💾 Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
