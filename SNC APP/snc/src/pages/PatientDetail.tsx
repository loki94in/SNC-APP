import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { IconArrowLeft, IconPlus } from "@tabler/icons-react";
import { api } from "@/lib/api";
import { usePermission } from "@/App";
import NoAccess from "@/components/NoAccess";
import { emitAppEvent } from "@/lib/appEvents";

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-[#fee2e2] p-6 text-center">
      <div className="text-2xl mb-2">⚠️</div>
      <div className="text-sm font-semibold text-[#dc2626] mb-2">{message}</div>
      <button onClick={onRetry} className="text-sm text-[#1a7a4a] underline hover:text-[#0d4a2c]">
        Try Again
      </button>
    </div>
  );
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<any>(null);
  const [patientError, setPatientError] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsError, setSessionsError] = useState(false);
  const [regularPlan, setRegularPlan] = useState<any>(null);
  const [regularError, setRegularError] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "sessions" | "regular">("info");
  const [showModal, setShowModal] = useState(false);
  const [showRegularPlanModal, setShowRegularPlanModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const { canView, canEdit } = usePermission("patient-detail");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setPatientError(false);
    api<{ patient: any }>(`/api/patients/${id}`)
      .then(data => {
        if (data.patient) {
          const p = { ...data.patient };
          try { p.conditions = JSON.parse(p.conditions || "[]"); } catch { p.conditions = []; }
          try { p.restrictions = JSON.parse(p.restrictions || "[]"); } catch { p.restrictions = []; }
          setPatient(p);
        } else {
          setPatient(null);
        }
      })
      .catch(() => setPatientError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const loadSessions = useCallback(() => {
    if (!id) return;
    setSessionsLoading(true);
    setSessionsError(false);
    api<{ sessions: any[] }>(`/api/sessions/by-patient/${id}`)
      .then(data => setSessions(data.sessions || []))
      .catch(() => setSessionsError(true))
      .finally(() => setSessionsLoading(false));
  }, [id]);

  const loadRegularPlan = useCallback(() => {
    if (!id) return;
    setPlanLoading(true);
    setRegularError(false);
    api<any>(`/api/regular?patientId=${id}`)
      .then(data => {
        const plans = Array.isArray(data) ? data : [];
        setRegularPlan(plans.length > 0 ? plans[0] : null);
      })
      .catch(() => setRegularError(true))
      .finally(() => setPlanLoading(false));
  }, [id]);

  useEffect(() => {
    if (activeTab === "sessions") loadSessions();
    if (activeTab === "regular") loadRegularPlan();
  }, [activeTab, loadSessions, loadRegularPlan]);

  if (!canView) return <NoAccess message="Access Restricted" detail="You do not have permission to view patient details." />;
  if (loading) return <div className="text-center py-12 text-[#6b8878]">Loading...</div>;
  if (patientError) return (
    <div className="text-center py-12">
      <div className="text-2xl mb-2">⚠️</div>
      <div className="text-sm font-semibold text-[#dc2626] mb-2">Failed to load patient</div>
      <button onClick={() => window.location.reload()} className="text-sm text-[#1a7a4a] underline">Try Again</button>
      <Link to="/patients" className="block mt-2 text-sm text-[#6b8878]">← Back to Patients</Link>
    </div>
  );
  if (!patient) return (
    <div className="text-center py-12 text-[#6b8878]">
      <div className="text-4xl mb-2">👤</div>
      <div>Patient not found</div>
      <Link to="/patients" className="text-sm text-[#1a7a4a] underline mt-2 inline-block">← Back to Patients</Link>
    </div>
  );

  const conds = Array.isArray(patient.conditions) ? patient.conditions : [];
  const rests = Array.isArray(patient.restrictions) ? patient.restrictions : [];
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
          <div className="text-sm text-[#6b8878] mt-1">
            Reg: {patient.reg_no || "—"} &bull; {patient.age || "?"}/{patient.sex?.[0] || "?"} &bull; {patient.mobile}
          </div>
          <div className="flex gap-2 mt-2">
            {conds.map((c: string) => <span key={c} className="px-2 py-0.5 bg-[#fef3c7] text-[#d97706] rounded text-xs font-bold">&#9888; {c}</span>)}
            {rests.map((r: string) => <span key={r} className="px-2 py-0.5 bg-[#fee2e2] text-[#dc2626] rounded text-xs font-bold">&#128683; {r}</span>)}
          </div>
        </div>
        {canEdit && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#e8a020] text-[#0d4a2c] font-semibold rounded-lg">
            <IconPlus className="w-4 h-4" /> Add Session
          </button>
        )}
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
              <div><span className="text-[#6b8878]">Occupation:</span> {patient.occupation || "—"}</div>
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
          {sessionsLoading ? (
            <div className="bg-white rounded-xl border border-[#cfe0d8] p-12 text-center">
              <div className="h-6 w-24 mx-auto bg-[#f0f7f4] rounded animate-pulse" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#cfe0d8] p-12 text-center">
              <div className="text-4xl mb-2">&#129524;</div>
              <div className="font-medium text-[#6b8878]">No sessions yet</div>
            </div>
          ) : sessions.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-[#cfe0d8] p-5">
              <div className="flex items-center justify-between mb-3">
                <div><span className="font-bold text-lg">#{s.session_no}</span> <span className="ml-3 text-sm text-[#6b8878]">{s.date}</span></div>
                <span className="font-bold text-[#1a7a4a]">&#8377;{s.payment || 0}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-[#fef3c7] rounded-lg">
                  <div className="font-bold text-xs text-[#d97706] mb-2">&#128203; PRE</div>
                  <div className="space-y-1">
                    <div>Complaint: {s.pre_complaint || "—"}</div>
                    <div>Pain: {s.pre_pain ?? "—"}/10</div>
                    <div>Mobility: {s.pre_mobility || "—"}</div>
                    <div>Vitals: {s.pre_vitals || "—"}</div>
                  </div>
                </div>
                <div className="p-3 bg-[#dcfce7] rounded-lg">
                  <div className="font-bold text-xs text-[#16a34a] mb-2">&#9989; POST</div>
                  <div className="space-y-1">
                    <div>Response: {s.post_response || "—"}</div>
                    <div>Post Pain: {s.post_pain ?? "—"}/10</div>
                    <div>Techniques: {s.post_techniques || "—"}</div>
                    <div>Notes: {s.post_notes || "—"}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "regular" && (
        <div className="bg-white rounded-xl border border-[#cfe0d8] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-[#6b8878]">Regular Visit Plans</h3>
            <button onClick={() => setShowRegularPlanModal(true)}
              className="px-3 py-1.5 bg-[#1a7a4a] text-white text-xs font-semibold rounded-lg hover:bg-[#0d4a2c]">
              + Create Plan
            </button>
          </div>
          {planLoading ? (
            <div className="h-24 bg-[#f0f7f4] rounded animate-pulse" />
          ) : regularPlan ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#e8a020] rounded-full flex items-center justify-center font-bold text-[#0d4a2c]">
                  {patient.name?.charAt(0) || "?"}
                </div>
                <div>
                  <div className="font-semibold">{patient.name} &mdash; Regular Visit Plan</div>
                  <div className="text-xs text-[#6b8878]">Active Plan</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-[#f0f7f4] rounded-lg">
                  <div className="text-[11px] font-bold text-[#6b8878] uppercase mb-1">Frequency</div>
                  <div className="font-bold text-[#1a7a4a]">{regularPlan.frequency}</div>
                </div>
                <div className="p-3 bg-[#f0f7f4] rounded-lg">
                  <div className="text-[11px] font-bold text-[#6b8878] uppercase mb-1">Days</div>
                  <div className="font-bold text-[#1a7a4a]">
                    {(() => { try { return JSON.parse(regularPlan.days || "[]").join(", "); } catch { return regularPlan.days || "—"; } })()}
                  </div>
                </div>
                <div className="p-3 bg-[#f0f7f4] rounded-lg">
                  <div className="text-[11px] font-bold text-[#6b8878] uppercase mb-1">Protocol</div>
                  <div className="font-bold text-[#1a7a4a]">{regularPlan.protocol || "—"}</div>
                </div>
              </div>
              {regularPlan.start_date && <div className="text-sm text-[#6b8878]">Started: {regularPlan.start_date}</div>}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">&#128197;</div>
              <div className="text-[#6b8878]">No regular visit plan for this patient</div>
              <div className="text-sm text-[#6b8878] mt-1">Set up a regular visit plan to track recurring appointments</div>
            </div>
          )}
        </div>
      )}

      {showModal && <SessionModal patientId={id!} onClose={() => { setShowModal(false); loadSessions(); }} />}
      {showRegularPlanModal && (
        <RegularPlanModal
          patientId={id!}
          existingPlan={regularPlan}
          onClose={() => setShowRegularPlanModal(false)}
          onSaved={() => { setShowRegularPlanModal(false); loadRegularPlan(); }}
        />
      )}
    </div>
  );
}

// ─── REGULAR PLAN MODAL ───────────────────────────────────────────────────

interface RegularPlanModalProps {
  patientId: string;
  existingPlan: any;
  onClose: () => void;
  onSaved: () => void;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function RegularPlanModal({ patientId, existingPlan, onClose, onSaved }: RegularPlanModalProps) {
  const [frequency, setFrequency] = useState(existingPlan?.frequency || "WEEKLY");
  const [selectedDays, setSelectedDays] = useState<string[]>(() => {
    if (existingPlan?.days) {
      try { return JSON.parse(existingPlan.days); } catch {}
    }
    return [];
  });
  const [protocol, setProtocol] = useState(existingPlan?.protocol || "");
  const [startDate, setStartDate] = useState(existingPlan?.start_date || new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(existingPlan?.end_date || "");
  const [targetCount, setTargetCount] = useState(String(existingPlan?.target_count || ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSave = async () => {
    if (!patientId) return;
    setSaving(true);
    setError(null);
    try {
      await api("/api/regular/plan", {
        method: "POST",
        body: {
          patientId,
          frequency,
          days: selectedDays,
          protocol,
          startDate,
          endDate,
          targetCount: targetCount ? parseInt(targetCount) : 0,
        },
      });
      onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="px-6 py-4 border-b border-[#cfe0d8] flex items-center justify-between">
          <h2 className="font-['Syne'] text-base font-extrabold text-[#0d4a2c]">
            {existingPlan ? "Edit Regular Plan" : "Create Regular Plan"}
          </h2>
          <button onClick={onClose} className="text-xl text-[#6b8878] hover:text-[#1a2e24]">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="text-sm text-[#dc2626] bg-[#fee2e2] px-4 py-2 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Frequency</label>
            <select value={frequency} onChange={e => setFrequency(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]">
              <option value="WEEKLY">Weekly</option>
              <option value="BIWEEKLY">Bi-Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Days of Week</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(day => (
                <button key={day} type="button" onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 border rounded-full text-sm font-medium transition-all ${
                    selectedDays.includes(day) ? "bg-[#d4ede1] border-[#1a7a4a] text-[#1a7a4a]" : "border-[#cfe0d8] text-[#6b8878]"
                  }`}>{day}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Protocol / Notes</label>
            <textarea value={protocol} onChange={e => setProtocol(e.target.value)} rows={3}
              className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a] resize-none"
              placeholder="e.g. Spine treatment, Acupuncture..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Target Sessions</label>
            <input type="number" value={targetCount} onChange={e => setTargetCount(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]"
              placeholder="e.g. 12" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#cfe0d8] flex gap-3 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 border border-[#cfe0d8] text-[#6b8878] font-semibold rounded-lg hover:bg-[#f0f7f4]"
            disabled={saving}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg hover:bg-[#0d4a2c] disabled:opacity-50">
            {saving ? "Saving..." : "💾 Save Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SESSION MODAL ──────────────────────────────────────────────────────────

interface SessionModalProps {
  patientId: string;
  onClose: () => void;
}

function SessionModal({ patientId, onClose }: SessionModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    visitType: "IN-CLINIC",
    clinicianId: "",
    clinicianName: "",
    duration: "",
    payment: "",
    paymentMode: "CASH",
    preComplaint: "",
    prePain: 5,
    preMobility: "Normal",
    preVitals: "",
    preNotes: "",
    postTechniques: "",
    postPain: 2,
    postResponse: "GOOD",
    postNotes: "",
    postRecommendation: "",
    followup: "",
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.date) {
      setError("Date is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api("/api/sessions/", {
        method: "POST",
        body: {
          patientId,
          date: form.date,
          visitType: form.visitType,
          clinicianId: form.clinicianId,
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
      onClose();
      emitAppEvent("app:sessions-changed");
      emitAppEvent("app:patients-changed");
    } catch (err: any) {
      setError(err.message || "Failed to save session");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-4 border-b border-[#cfe0d8] flex items-center justify-between">
          <h2 className="font-['Syne'] text-base font-extrabold text-[#0d4a2c]">🩺 Add Session</h2>
          <button onClick={onClose} className="text-xl text-[#6b8878] hover:text-[#1a2e24]">✕</button>
        </div>

        <div className="p-6 space-y-5">

          {error && (
            <div className="text-sm text-[#dc2626] bg-[#fee2e2] px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Row 1: Date + Visit Type + Duration */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={set("date")}
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Visit Type</label>
              <select
                value={form.visitType}
                onChange={set("visitType")}
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]"
              >
                <option value="IN-CLINIC">In-Clinic</option>
                <option value="HOME">Home Visit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Duration (min)</label>
              <input
                type="number"
                value={form.duration}
                onChange={set("duration")}
                placeholder="e.g. 45"
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]"
              />
            </div>
          </div>

          {/* Row 2: Payment Amount + Payment Mode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Payment (₹)</label>
              <input
                type="number"
                value={form.payment}
                onChange={set("payment")}
                placeholder="0"
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Payment Mode</label>
              <select
                value={form.paymentMode}
                onChange={set("paymentMode")}
                className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>

          {/* Pre-Treatment Section */}
          <div className="border-t-2 border-[#fef3c7] pt-4">
            <div className="text-xs font-bold text-[#d97706] uppercase tracking-wide mb-3">📋 Pre-Treatment Assessment</div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Chief Complaint</label>
                <textarea
                  value={form.preComplaint}
                  onChange={set("preComplaint")}
                  rows={2}
                  placeholder="Patient's main issue before session..."
                  className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Pain Level: {form.prePain}/10</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={form.prePain}
                  onChange={e => setForm(p => ({ ...p, prePain: parseInt(e.target.value) }))}
                  className="w-full accent-[#d97706]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Mobility</label>
                  <select
                    value={form.preMobility}
                    onChange={set("preMobility")}
                    className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]"
                  >
                    <option>Normal</option>
                    <option>Restricted</option>
                    <option>Bedridden</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">BP / Pulse</label>
                  <input
                    type="text"
                    value={form.preVitals}
                    onChange={set("preVitals")}
                    placeholder="e.g. 120/80, 72bpm"
                    className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Pre-Assessment Notes</label>
                <textarea
                  value={form.preNotes}
                  onChange={set("preNotes")}
                  rows={2}
                  placeholder="Observations before starting treatment..."
                  className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Post-Treatment Section */}
          <div className="border-t-2 border-[#dcfce7] pt-4">
            <div className="text-xs font-bold text-[#16a34a] uppercase tracking-wide mb-3">✅ Post-Treatment Assessment</div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Techniques Applied</label>
                <input
                  type="text"
                  value={form.postTechniques}
                  onChange={set("postTechniques")}
                  placeholder="e.g. Spinal manipulation, Acupressure, Yoga..."
                  className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Post-Session Pain: {form.postPain}/10</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={form.postPain}
                  onChange={e => setForm(p => ({ ...p, postPain: parseInt(e.target.value) }))}
                  className="w-full accent-[#16a34a]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Patient Response</label>
                <select
                  value={form.postResponse}
                  onChange={set("postResponse")}
                  className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]"
                >
                  <option value="VERY_GOOD">Very Good</option>
                  <option value="GOOD">Good</option>
                  <option value="NEUTRAL">Neutral</option>
                  <option value="POOR">Poor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Post-Assessment Notes</label>
                <textarea
                  value={form.postNotes}
                  onChange={set("postNotes")}
                  rows={2}
                  placeholder="Outcome observations..."
                  className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Next Session Recommendation</label>
                <textarea
                  value={form.postRecommendation}
                  onChange={set("postRecommendation")}
                  rows={2}
                  placeholder="What to do next time..."
                  className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Follow-up Date</label>
                <input
                  type="date"
                  value={form.followup}
                  onChange={set("followup")}
                  className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]"
                />
              </div>
            </div>
          </div>

        </div>

        <div className="px-6 py-4 border-t border-[#cfe0d8] flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#cfe0d8] text-[#6b8878] font-semibold rounded-lg hover:bg-[#f0f7f4]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg hover:bg-[#0d4a2c] disabled:opacity-50"
          >
            {saving ? "Saving..." : "💾 Save Session"}
          </button>
        </div>
      </div>
    </div>
  );
}
