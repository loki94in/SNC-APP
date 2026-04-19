import { useState, useEffect } from "react";
import { IconUsers, IconReport, IconReceipt, IconCalendar, IconTrendingUp, IconClock } from "@tabler/icons-react";

interface Stats {
  totalPatients: number;
  todaySessions: number;
  monthlyRevenue: number;
  regularPatients: number;
}

interface RecentSession {
  id: string;
  patientName: string;
  date: string;
  clinician: string;
  response: string;
}

interface Payment {
  id: string;
  patientName: string;
  amount: number;
  mode: string;
  date: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    todaySessions: 0,
    monthlyRevenue: 0,
    regularPatients: 0,
  });
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [regularPatientsToday, setRegularPatientsToday] = useState<any[]>([]);

  useEffect(() => {
    // Load from localStorage (simulating backend data)
    const patients = JSON.parse(localStorage.getItem("snc_patients") || "[]");
    const sessions = JSON.parse(localStorage.getItem("snc_sessions") || "[]");
    const payments = JSON.parse(localStorage.getItem("snc_payments") || "[]");
    const regularPlans = JSON.parse(localStorage.getItem("snc_regular_plans") || "[]");

    const today = new Date().toISOString().split("T")[0];
    const todaySessions = sessions.filter((s: any) => s.date === today);
    const monthlyRevenue = payments
      .filter((p: any) => p.date?.startsWith(today.substring(0, 7)))
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    setStats({
      totalPatients: patients.length,
      todaySessions: todaySessions.length,
      monthlyRevenue,
      regularPatients: regularPlans.filter((p: any) => p.active).length,
    });

    setRecentSessions(
      sessions
        .slice(-5)
        .reverse()
        .map((s: any) => ({
          id: s.id,
          patientName: patients.find((p: any) => p.id === s.patientId)?.name || "Unknown",
          date: s.date,
          clinician: s.clinicianName || "—",
          response: s.post?.response || "—",
        }))
    );

    setRecentPayments(
      payments
        .slice(-5)
        .reverse()
        .map((p: any) => ({
          id: p.id,
          patientName: patients.find((pt: any) => pt.id === p.patientId)?.name || "Unknown",
          amount: p.amount,
          mode: p.mode,
          date: p.date,
        }))
    );

    // Regular patients due today
    const dayOfWeek = new Date().getDay();
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const todayKey = dayNames[dayOfWeek];

    setRegularPatientsToday(
      regularPlans.filter((plan: any) => {
        if (!plan.active) return false;
        if (plan.frequency === "DAILY") return true;
        if (plan.frequency === "WEEKLY" && plan.days?.includes(todayKey)) return true;
        if (plan.frequency === "ALTERNATE" && plan.days?.includes(todayKey)) return true;
        return false;
      }).map((plan: any) => ({
        ...plan,
        patient: patients.find((p: any) => p.id === plan.patientId),
      }))
    );
  }, []);

  const statCards = [
    { label: "Total Patients", value: stats.totalPatients, icon: IconUsers, color: "#1a7a4a" },
    { label: "Today's Sessions", value: stats.todaySessions, icon: IconClock, color: "#2563eb" },
    { label: "Monthly Revenue", value: `₹${stats.monthlyRevenue.toLocaleString()}`, icon: IconReceipt, color: "#16a34a" },
    { label: "Regular Patients", value: stats.regularPatients, icon: IconTrendingUp, color: "#e8a020" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-[#cfe0d8] p-5 relative overflow-hidden">
            <div className="text-[11px] font-bold text-[#6b8878] uppercase tracking-wide mb-2">{stat.label}</div>
            <div className="font-['Syne'] text-3xl font-extrabold text-[#0d4a2c]">{stat.value}</div>
            <stat.icon
              className="absolute right-4 top-4 text-3xl opacity-10"
              style={{ color: stat.color }}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <div className="bg-white rounded-xl border border-[#cfe0d8]">
          <div className="px-5 py-4 border-b border-[#cfe0d8] flex items-center gap-3">
            <IconReport className="w-5 h-5 text-[#1a7a4a]" />
            <h3 className="font-['Syne'] text-sm font-extrabold text-[#0d4a2c]">Recent Sessions</h3>
          </div>
          <div className="p-5">
            {recentSessions.length === 0 ? (
              <div className="text-center py-8 text-[#6b8878]">
                <div className="text-3xl mb-2">🩺</div>
                <div className="font-medium">No sessions yet</div>
                <div className="text-sm">Sessions will appear here</div>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f0f7f4] cursor-pointer transition-colors">
                    <div className="w-10 h-10 bg-[#d4ede1] rounded-full flex items-center justify-center text-sm font-bold text-[#1a7a4a]">
                      {session.patientName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{session.patientName}</div>
                      <div className="text-xs text-[#6b8878]">{session.date} • {session.clinician}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      session.response === "VERY GOOD" || session.response === "GOOD"
                        ? "bg-[#dcfce7] text-[#16a34a]"
                        : session.response === "POOR"
                        ? "bg-[#fee2e2] text-[#dc2626]"
                        : "bg-[#f3f4f6] text-[#6b7280]"
                    }`}>
                      {session.response}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl border border-[#cfe0d8]">
          <div className="px-5 py-4 border-b border-[#cfe0d8] flex items-center gap-3">
            <IconReceipt className="w-5 h-5 text-[#1a7a4a]" />
            <h3 className="font-['Syne'] text-sm font-extrabold text-[#0d4a2c]">Recent Payments</h3>
          </div>
          <div className="p-5">
            {recentPayments.length === 0 ? (
              <div className="text-center py-8 text-[#6b8878]">
                <div className="text-3xl mb-2">💰</div>
                <div className="font-medium">No payments yet</div>
                <div className="text-sm">Payments will appear here</div>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f0f7f4] transition-colors">
                    <div className="w-10 h-10 bg-[#fef3c7] rounded-full flex items-center justify-center text-sm">
                      💵
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{payment.patientName}</div>
                      <div className="text-xs text-[#6b8878]">{payment.date}</div>
                    </div>
                    <div className="font-bold text-[#1a7a4a]">₹{payment.amount}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Regular Patients Today */}
        <div className="bg-white rounded-xl border border-[#cfe0d8] col-span-2">
          <div className="px-5 py-4 border-b border-[#cfe0d8] flex items-center gap-3">
            <IconCalendar className="w-5 h-5 text-[#1a7a4a]" />
            <h3 className="font-['Syne'] text-sm font-extrabold text-[#0d4a2c]">Regular Patients Today</h3>
          </div>
          <div className="p-5">
            {regularPatientsToday.length === 0 ? (
              <div className="text-center py-8 text-[#6b8878]">
                <div className="text-3xl mb-2">📅</div>
                <div className="font-medium">No regular patients due today</div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {regularPatientsToday.map((rp: any) => (
                  <div key={rp.id} className="p-4 rounded-lg border border-[#cfe0d8] hover:bg-[#f0f7f4] cursor-pointer transition-colors">
                    <div className="font-semibold text-sm">{rp.patient?.name || "Unknown"}</div>
                    <div className="text-xs text-[#6b8878] mt-1">{rp.frequency} • {rp.days?.join(", ")}</div>
                    <div className="mt-2 flex gap-2">
                      <button className="px-3 py-1 bg-[#16a34a] text-white text-xs font-bold rounded-full">
                        ✓ Mark Attended
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
