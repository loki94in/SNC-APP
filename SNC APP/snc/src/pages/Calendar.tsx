import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { usePermission } from "@/App";
import { onAppEvent } from "@/lib/appEvents";
import NoAccess from "@/components/NoAccess";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface Session {
  id: string;
  patient_id: string;
  patient_name?: string;
  date: string;
  clinician_name: string;
  post_response: string;
  payment: number;
}

function DataError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-[#fee2e2] p-6 text-center">
      <div className="text-2xl mb-2">⚠️</div>
      <div className="font-semibold text-[#dc2626] mb-1">Failed to load sessions</div>
      <div className="text-sm text-[#6b8878] mb-3">Could not reach the server.</div>
      <button onClick={onRetry} className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg hover:bg-[#0d4a2c] text-sm">
        Try Again
      </button>
    </div>
  );
}

export default function Calendar() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { canView } = usePermission("calendar");

  const loadSessions = () => {
    setLoading(true);
    setLoadError(false);
    api<{ sessions: Session[] }>("/api/sessions/")
      .then(data => setSessions(data.sessions || []))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  // Reload whenever any session mutation occurs elsewhere
  useEffect(() => {
    const cleanups = [
      onAppEvent("app:sessions-changed", loadSessions),
      onAppEvent("app:patients-changed", loadSessions),
    ];
    return () => cleanups.forEach(fn => fn());
  }, []);

  // Initial load
  useEffect(() => { loadSessions(); }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = today.toISOString().split("T")[0];

  const getSessionsForDate = (dateStr: string) =>
    sessions.filter(s => s.date === dateStr);

  const prevMonth = () => {
    setSelectedDate(null);
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setSelectedDate(null);
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  if (!canView) return <NoAccess message="Access Restricted" detail="You do not have permission to view calendar." />;

  const selectedDaySessions = selectedDate ? getSessionsForDate(selectedDate) : [];
  const monthSessionCount = sessions.length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-['Syne'] text-xl font-extrabold text-[#0d4a2c]">Calendar</h1>
        <p className="text-sm text-[#6b8878] mt-1">
          {loading ? "Loading..." : loadError ? "Load failed" : `${monthSessionCount} session${monthSessionCount !== 1 ? "s" : ""} loaded`}
        </p>
      </div>

      {loadError ? (
        <DataError onRetry={loadSessions} />
      ) : (
        <div className="bg-white rounded-xl border border-[#cfe0d8] p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="px-3 py-1 border border-[#cfe0d8] rounded-lg hover:border-[#1a7a4a] transition-colors text-sm">←</button>
            <h3 className="font-['Syne'] text-base font-extrabold text-[#0d4a2c]">{MONTHS[month]} {year}</h3>
            <button onClick={nextMonth} className="px-3 py-1 border border-[#cfe0d8] rounded-lg hover:border-[#1a7a4a] transition-colors text-sm">→</button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(d => <div key={d} className="text-center text-[10px] font-bold text-[#6b8878] uppercase py-2">{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className="h-20" />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const daySessions = getSessionsForDate(dateStr);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              return (
                <div key={day}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`h-20 border rounded-lg p-2 cursor-pointer transition-all overflow-hidden ${
                    isToday ? "border-[#1a7a4a] bg-[#d4ede1]" : "border-[#cfe0d8] hover:bg-[#f0f7f4]"
                  } ${isSelected ? "ring-2 ring-[#1a7a4a]" : ""}`}>
                  <div className={`text-sm font-bold ${isToday ? "text-[#1a7a4a]" : "text-[#1a2e24]"}`}>{day}</div>
                  {daySessions.length > 0 && (
                    <div className="mt-1 flex flex-col gap-0.5 overflow-hidden">
                      {daySessions.slice(0, 2).map(s => (
                        <div key={s.id} className="text-[10px] bg-[#1a7a4a] text-white rounded px-1 truncate">
                          {s.clinician_name || "Session"}
                        </div>
                      ))}
                      {daySessions.length > 2 && (
                        <div className="text-[10px] text-[#6b8878]">+{daySessions.length - 2} more</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedDate && (
        <div className="bg-white rounded-xl border border-[#cfe0c8] p-5">
          <h3 className="font-semibold text-[#0d4a2c] mb-3">Sessions on {selectedDate}</h3>
          {selectedDaySessions.length === 0 ? (
            <p className="text-sm text-[#6b8878]">No sessions scheduled for this date.</p>
          ) : (
            <div className="space-y-3">
              {selectedDaySessions.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#cfe0d8]">
                  <div className="w-10 h-10 bg-[#d4ede1] rounded-full flex items-center justify-center font-bold text-[#1a7a4a]">
                    {s.clinician_name?.charAt(0) || "S"}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{s.clinician_name || "Session"}</div>
                    <div className="text-xs text-[#6b8878]">Patient: {s.patient_name || s.patient_id}</div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      s.post_response === "VERY_GOOD" || s.post_response === "GOOD" ? "bg-[#dcfce7] text-[#16a34a]"
                      : s.post_response === "POOR" ? "bg-[#fee2e2] text-[#dc2626]"
                      : "bg-[#f3f4f6] text-[#6b7280]"
                    }`}>{s.post_response || "—"}</span>
                    {s.payment > 0 && (
                      <div className="text-xs font-bold text-[#1a7a4a] mt-1">₹{s.payment}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
