import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { IconUsers, IconReceipt, IconTrendingUp, IconClock } from "@tabler/icons-react";
import { api } from "@/lib/api";
import { onAppEvent } from "@/lib/appEvents";

interface Stats {
  totalPatients: number;
  todaySessions: number;
  monthRevenue: number;
  activePlans: number;
}

function DataError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="col-span-4 bg-white rounded-xl border border-[#fee2e2] p-8 text-center">
      <div className="text-3xl mb-2">⚠️</div>
      <div className="font-semibold text-[#dc2626] mb-1">Failed to load dashboard</div>
      <div className="text-sm text-[#6b8878] mb-4">Could not reach the server.</div>
      <button onClick={onRetry} className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg hover:bg-[#0d4a2c] text-sm">
        Try Again
      </button>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ totalPatients: 0, todaySessions: 0, monthRevenue: 0, activePlans: 0 });
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadData = () => {
    setLoading(true);
    setLoadError(false);
    api<{ stats: Stats; recentPatients: any[] }>("/api/dashboard/")
      .then(data => {
        setStats(data.stats || { totalPatients: 0, todaySessions: 0, monthRevenue: 0, activePlans: 0 });
        setRecentPatients(data.recentPatients || []);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  // Reload whenever any mutation happens elsewhere in the app
  useEffect(() => {
    const cleanups = [
      onAppEvent("app:patients-changed", loadData),
      onAppEvent("app:sessions-changed", loadData),
      onAppEvent("app:payments-changed", loadData),
    ];
    return () => cleanups.forEach(fn => fn());
  }, []);

  // Initial load
  useEffect(() => { loadData(); }, []);

  const statCards = [
    { label: "Total Patients", value: stats.totalPatients, icon: IconUsers, color: "#1a7a4a" },
    { label: "Today's Sessions", value: stats.todaySessions, icon: IconClock, color: "#2563eb" },
    { label: "Monthly Revenue", value: `₹${(stats.monthRevenue || 0).toLocaleString()}`, icon: IconReceipt, color: "#16a34a" },
    { label: "Regular Patients", value: stats.activePlans, icon: IconTrendingUp, color: "#e8a020" },
  ];

  return (
    <div className="space-y-6">
      {loadError ? (
        <DataError onRetry={loadData} />
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-[#cfe0d8] p-5 relative overflow-hidden">
              <div className="text-[11px] font-bold text-[#6b8878] uppercase tracking-wide mb-2">{stat.label}</div>
              {loading ? (
                <div className="h-8 bg-[#f0f7f4] rounded animate-pulse" />
              ) : (
                <div className="font-['Syne'] text-3xl font-extrabold text-[#0d4a2c]">{stat.value}</div>
              )}
              <stat.icon className="absolute right-4 top-4 text-3xl opacity-10" style={{ color: stat.color }} />
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#cfe0d8]">
        <div className="px-5 py-4 border-b border-[#cfe0d8] flex items-center gap-3">
          <IconUsers className="w-5 h-5 text-[#1a7a4a]" />
          <h3 className="font-['Syne'] text-sm font-extrabold text-[#0d4a2c]">Recent Patients</h3>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-[#f0f7f4] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentPatients.length === 0 ? (
            <div className="text-center py-12 text-[#6b8878]">
              <div className="text-4xl mb-2">👤</div>
              <div className="font-medium">No patients registered yet</div>
              <div className="text-sm mt-1">Patients will appear here once added to the system.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPatients.map((pt: any) => (
                <Link
                  key={pt.id}
                  to={`/patients/${pt.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f0f7f4] cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 bg-[#d4ede1] rounded-full flex items-center justify-center text-sm font-bold text-[#1a7a4a]">
                    {pt.name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{pt.name}</div>
                    <div className="text-xs text-[#6b8878]">{pt.reg_no || pt.mobile || "—"}</div>
                  </div>
                  <span className="px-2 py-0.5 bg-[#dcfce7] text-[#16a34a] rounded-full text-[11px] font-bold">
                    Active
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
