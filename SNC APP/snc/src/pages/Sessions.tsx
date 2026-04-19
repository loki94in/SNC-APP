import { useState, useEffect } from "react";

interface Session {
  id: string; patientId: string; sessionNo: number; date: string; visitType: string; clinicianName: string; payment: number; pre: any; post: any; patientName?: string;
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const allSessions: Session[] = JSON.parse(localStorage.getItem("snc_sessions") || "[]");
    const patients = JSON.parse(localStorage.getItem("snc_patients") || "[]");
    setSessions(allSessions.map(s => ({
      ...s,
      patientName: patients.find((p: any) => p.id === s.patientId)?.name || "Unknown"
    })).reverse());
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-['Syne'] text-xl font-extrabold text-[#0d4a2c]">Sessions</h1>
        <p className="text-sm text-[#6b8878] mt-1">{sessions.length} total sessions</p>
      </div>

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
            {sessions.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-[#6b8878]">
                <div className="text-4xl mb-2">🩺</div><div>No sessions recorded</div>
              </td></tr>
            ) : sessions.map(s => (
              <tr key={s.id} className="border-t border-[#cfe0d8] hover:bg-[#f0f7f4] transition-colors">
                <td className="px-4 py-3"><strong>#{s.sessionNo}</strong></td>
                <td className="px-4 py-3 font-semibold">{s.patientName}</td>
                <td className="px-4 py-3 text-sm">{s.date}</td>
                <td className="px-4 py-3 text-sm">{s.visitType === "HOME" ? "🏠 Home" : "🏥 Clinic"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${s.post?.response === "VERY GOOD" || s.post?.response === "GOOD" ? "bg-[#dcfce7] text-[#16a34a]" : s.post?.response === "POOR" ? "bg-[#fee2e2] text-[#dc2626]" : "bg-[#f3f4f6] text-[#6b7280]"}`}>
                    {s.post?.response || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-[#1a7a4a]">₹{s.payment || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}