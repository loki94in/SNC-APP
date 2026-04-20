import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { usePermission } from "@/App";
import { onAppEvent } from "@/lib/appEvents";
import NoAccess from "@/components/NoAccess";

interface Plan {
  id: string;
  patient_id: string;
  frequency: string;
  days: string;
  protocol: string;
  start_date: string;
  end_date: string;
  target_count: number;
  active: number;
  patient_name?: string;
}

function DataError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="col-span-3 bg-white rounded-xl border border-[#fee2e2] p-8 text-center">
      <div className="text-3xl mb-2">⚠️</div>
      <div className="font-semibold text-[#dc2626] mb-1">Failed to load visit plans</div>
      <div className="text-sm text-[#6b8878] mb-4">Could not reach the server.</div>
      <button onClick={onRetry} className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg hover:bg-[#0d4a2c] text-sm">
        Try Again
      </button>
    </div>
  );
}

export default function RegularVisits() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { canView } = usePermission("regular-visits");

  const loadData = () => {
    setLoading(true);
    setLoadError(false);
    Promise.all([
      api<{ patients: any[] }>("/api/patients/"),
      api<any[]>("/api/regular/today"),
    ])
      .then(([ptData, planData]) => {
        setPatients(ptData.patients || []);
        setPlans(planData || []);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  // Reload whenever patients or sessions change elsewhere
  useEffect(() => {
    const cleanups = [
      onAppEvent("app:patients-changed", loadData),
      onAppEvent("app:sessions-changed", loadData),
    ];
    return () => cleanups.forEach(fn => fn());
  }, []);

  // Initial load
  useEffect(() => { loadData(); }, []);

  const activePlans = plans.filter(p => p.active);
  const getPatient = (patientId: string) => patients.find((p: any) => p.id === patientId);

  if (!canView) return <NoAccess message="Access Restricted" detail="You do not have permission to view regular visits." />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-['Syne'] text-xl font-extrabold text-[#0d4a2c]">Regular Visit Tracker</h1>
        <p className="text-sm text-[#6b8878] mt-1">
          {loadError ? "Load failed" : loading ? "..." : `${activePlans.length} active plan${activePlans.length !== 1 ? "s" : ""} today`}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {loadError ? (
          <DataError onRetry={loadData} />
        ) : loading ? (
          [1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl border border-[#cfe0d8] p-5 h-32 animate-pulse" />)
        ) : activePlans.length === 0 ? (
          <div className="col-span-3 bg-white rounded-xl border border-[#cfe0d8] p-12 text-center">
            <div className="text-4xl mb-2">&#128197;</div>
            <div className="font-medium text-[#6b8878]">No regular visit plans for today</div>
            <div className="text-sm text-[#6b8878] mt-1">Set up recurring plans from patient profiles.</div>
          </div>
        ) : activePlans.map(plan => {
          const patient = getPatient(plan.patient_id);
          let days: string[] = [];
          try { days = JSON.parse(plan.days || "[]"); } catch { days = []; }
          return (
            <div key={plan.id} className="bg-white rounded-xl border border-[#cfe0d8] p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#e8a020] rounded-full flex items-center justify-center font-bold text-[#0d4a2c]">
                  {patient?.name?.charAt(0) || "?"}
                </div>
                <div>
                  <div className="font-semibold">{patient?.name || plan.patient_name || "Unknown Patient"}</div>
                  <div className="text-xs text-[#6b8878]">{patient?.reg_no || ""}</div>
                </div>
              </div>
              <div className="text-sm text-[#6b8878] space-y-1">
                <div><span className="font-bold text-[#1a7a4a]">{plan.frequency}</span></div>
                {days.length > 0 && <div>{days.join(", ")}</div>}
                {plan.protocol && <div className="text-xs truncate">{plan.protocol}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
