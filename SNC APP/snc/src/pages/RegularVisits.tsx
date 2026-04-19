import { useState, useEffect } from "react";

interface Plan { id: string; patientId: string; frequency: string; days: string[]; active: boolean; }

export default function RegularVisits() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    setPlans(JSON.parse(localStorage.getItem("snc_regular_plans") || "[]"));
    setPatients(JSON.parse(localStorage.getItem("snc_patients") || "[]"));
  }, []);

  const getPatient = (id: string) => patients.find(p => p.id === id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-['Syne'] text-xl font-extrabold text-[#0d4a2c]">Regular Visit Tracker</h1>
        <p className="text-sm text-[#6b8878] mt-1">{plans.filter(p => p.active).length} active plans</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {plans.filter(p => p.active).map(plan => {
          const patient = getPatient(plan.patientId);
          return (
            <div key={plan.id} className="bg-white rounded-xl border border-[#cfe0d8] p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#e8a020] rounded-full flex items-center justify-center font-bold text-[#0d4a2c]">
                  {patient?.name?.charAt(0) || "?"}
                </div>
                <div>
                  <div className="font-semibold">{patient?.name || "Unknown"}</div>
                  <div className="text-xs text-[#6b8878]">{patient?.regNo || ""}</div>
                </div>
              </div>
              <div className="text-sm text-[#6b8878]">
                <span className="font-bold text-[#1a7a4a]">{plan.frequency}</span>
                {plan.days?.length > 0 && ` • ${plan.days.join(", ")}`}
              </div>
            </div>
          );
        })}
        {plans.filter(p => p.active).length === 0 && (
          <div className="col-span-3 bg-white rounded-xl border border-[#cfe0d8] p-12 text-center">
            <div className="text-4xl mb-2">📅</div>
            <div className="text-[#6b8878]">No regular visit plans yet</div>
            <div className="text-sm text-[#6b8878] mt-1">Set up regular visits from patient profiles</div>
          </div>
        )}
      </div>
    </div>
  );
}
