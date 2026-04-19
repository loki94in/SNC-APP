import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { usePermission } from "@/App";
import { onAppEvent } from "@/lib/appEvents";
import NoAccess from "@/components/NoAccess";

interface Session {
  id: string;
  patient_id: string;
  patient_name?: string;
  session_no: number;
  date: string;
  visit_type: string;
  clinician_name: string;
  payment: number;
  post_response: string;
}

function DataError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-[#fee2e2] p-8 text-center">
      <div className="text-3xl mb-2">⚠️</div>
      <div className="font-semibold text-[#dc2626] mb-1">Failed to load sessions</div>
      <div className="text-sm text-[#6b8878] mb-4">Could not reach the server. Check your connection.</div>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg hover:bg-[#0d4a2c] text-sm"
      >
        Try Again
      </button>
    </div>
  );
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { canView } = usePermission("sessions");

  const loadSessions = () => {
    setLoading(true);
    setLoadError(false);
    api<{ sessions: Session[] }>("/api/sessions/")
      .then(data => setSessions(data.sessions || []))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  // Stay fresh: reload whenever any mutation occurs elsewhere
  useEffect(() => {
    const cleanups = [
      onAppEvent("app:sessions-changed", loadSessions),
    ];
    return () => cleanups.forEach(fn => fn());
  }, []);

  // Initial load only
  useEffect(() => { loadSessions(); }, []);

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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12"><div className="h-6 w-32 mx-auto bg-[#f0f7f4] rounded animate-pulse" /></td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-[#6b8878]">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
