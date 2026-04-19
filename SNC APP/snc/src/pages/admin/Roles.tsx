import { useState } from "react";

const ROLES = ["ADMIN", "CLINICIAN", "RECEPTIONIST", "FINANCE"];
const PERMISSIONS = ["Dashboard", "Patients", "Sessions", "Regular Visits", "Calendar", "Payments", "Admin"];
const PERM_VALUES = ["EDIT", "VIEW", "HIDDEN"];

export default function Roles() {
  const [matrix, setMatrix] = useState<Record<string, Record<string, string>>>(() => {
    const init: Record<string, Record<string, string>> = {};
    ROLES.forEach(role => {
      init[role] = {};
      PERMISSIONS.forEach(perm => {
        if (role === "ADMIN") init[role][perm] = "EDIT";
        else if (role === "CLINICIAN" && ["Dashboard", "Patients", "Sessions", "Regular Visits", "Calendar"].includes(perm)) init[role][perm] = "EDIT";
        else if (role === "RECEPTIONIST" && ["Dashboard", "Patients", "Calendar"].includes(perm)) init[role][perm] = "VIEW";
        else if (role === "FINANCE" && ["Dashboard", "Payments"].includes(perm)) init[role][perm] = "VIEW";
        else init[role][perm] = "HIDDEN";
      });
    });
    return init;
  });

  const updatePerm = (role: string, perm: string, val: string) => {
    setMatrix(prev => ({ ...prev, [role]: { ...prev[role], [perm]: val } }));
  };

  const handleSave = () => {
    localStorage.setItem("snc_permissions", JSON.stringify(matrix));
    alert("Permissions saved!");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-['Syne'] text-xl font-extrabold text-[#0d4a2c]">Roles & Permissions</h1>
        <p className="text-sm text-[#6b8878] mt-1">Configure access control for each role</p>
      </div>

      <div className="bg-white rounded-xl border border-[#cfe0d8] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f0f7f4]">
              <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Feature</th>
              {ROLES.map(role => (
                <th key={role} className="text-center px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">{role}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map(perm => (
              <tr key={perm} className="border-t border-[#cfe0d8]">
                <td className="px-4 py-3 font-semibold text-sm">{perm}</td>
                {ROLES.map(role => (
                  <td key={role} className="px-4 py-3 text-center">
                    <select value={matrix[role][perm]} onChange={e => updatePerm(role, perm, e.target.value)}
                      className="px-2 py-1 border border-[#cfe0d8] rounded text-xs focus:outline-none focus:border-[#1a7a4a]">
                      {PERM_VALUES.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={handleSave} className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg">Save All Permissions</button>
    </div>
  );
}
