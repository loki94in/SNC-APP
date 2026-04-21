import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { emitAppEvent } from "@/lib/appEvents";

const PERM_VALUES = ["EDIT", "VIEW", "HIDDEN"];
const BUILT_IN_ROLES = ["ADMIN", "CLINICIAN", "RECEPTIONIST", "FINANCE"];

interface PermMatrix {
  [role: string]: { [screen: string]: string };
}

const ALL_SCREENS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "patients", label: "Patient Master" },
  { key: "patient-detail", label: "Patient Detail" },
  { key: "sessions", label: "Session Notes" },
  { key: "regular-visits", label: "Regular Visit Tracker" },
  { key: "calendar", label: "Scheduler / Calendar" },
  { key: "payments", label: "Payment Entry" },
  { key: "admin-users", label: "Admin → Users" },
  { key: "admin-roles", label: "Admin → Roles" },
  { key: "admin-telegram", label: "Admin → Telegram" },
  { key: "admin-security", label: "Admin → Security" },
];

const DEFAULT_LEVELS: Record<string, string> = {
  ADMIN: "EDIT",
  CLINICIAN: "EDIT",
  RECEPTIONIST: "VIEW",
  FINANCE: "VIEW",
};

function DataError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-[#fee2e2] p-8 text-center">
      <div className="text-3xl mb-2">⚠️</div>
      <div className="font-semibold text-[#dc2626] mb-1">Failed to load permissions</div>
      <button onClick={onRetry} className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg hover:bg-[#0d4a2c] text-sm">
        Try Again
      </button>
    </div>
  );
}

export default function Roles() {
  const [matrix, setMatrix] = useState<PermMatrix>({});
  const [allRoles, setAllRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [addError, setAddError] = useState("");
  const [deletingRole, setDeletingRole] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setLoadError(false);
    Promise.all([
      api<{ permissions: any[] }>("/api/roles/permissions"),
      api<{ roles: string[] }>("/api/roles/roles"),
    ])
      .then(([permData, roleData]) => {
        const roles = roleData.roles || [];
        setAllRoles(roles);
        const built: PermMatrix = {};
        roles.forEach((role: string) => built[role] = {});
        if (permData.permissions && permData.permissions.length > 0) {
          for (const p of permData.permissions) {
            if (!built[p.role]) built[p.role] = {};
            built[p.role][p.screen] = p.level;
          }
        }
        for (const role of roles) {
          if (!built[role]) built[role] = {};
          for (const sc of ALL_SCREENS) {
            if (!built[role][sc.key]) {
              built[role][sc.key] = DEFAULT_LEVELS[role] || "HIDDEN";
            }
          }
        }
        setMatrix(built);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const updatePerm = (role: string, screen: string, val: string) => {
    setMatrix(prev => ({
      ...prev,
      [role]: { ...prev[role], [screen]: val },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const permissions = allRoles.flatMap(role =>
        ALL_SCREENS.map(sc => ({ role, screen: sc.key, level: matrix[role]?.[sc.key] || "HIDDEN" }))
      );
      await api("/api/roles/permissions", {
        method: "PUT",
        body: { permissions },
      });
      setMessage({ type: "success", text: "Permissions saved successfully!" });
      emitAppEvent("app:permissions-changed");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save permissions" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddRole = async () => {
    setAddError("");
    const name = newRoleName.trim().toUpperCase();
    if (!name) { setAddError("Role name is required"); return; }
    if (!/^[A-Z][A-Z0-9_]+$/.test(name)) { setAddError("Use uppercase letters, numbers and underscores only"); return; }
    if (allRoles.includes(name)) { setAddError("Role already exists"); return; }
    try {
      await api("/api/auth/roles", { method: "POST", body: { role: name } });
      setShowAddRole(false);
      setNewRoleName("");
      loadData();
      setMessage({ type: "success", text: `Role "${name}" created with default permissions.` });
    } catch (err: any) {
      setAddError(err.message || "Failed to create role");
    }
  };

  const handleDeleteRole = async (role: string) => {
    try {
      await api(`/api/auth/roles/${role}`, { method: "DELETE" });
      setDeletingRole(null);
      loadData();
      setMessage({ type: "success", text: `Role "${role}" deleted.` });
    } catch (err: any) {
      alert(err.message || "Failed to delete role");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Syne'] text-xl font-extrabold text-[#0d4a2c]">Roles & Permissions</h1>
          <p className="text-sm text-[#6b8878] mt-1">{loading ? "..." : `${allRoles.length} roles configured`}</p>
        </div>
        <button
          onClick={() => setShowAddRole(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a7a4a] hover:bg-[#0d4a2c] text-white font-semibold rounded-lg transition-colors text-sm"
        >
          + Add Role
        </button>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#fee2e2] text-[#dc2626]"}`}>
          {message.text}
        </div>
      )}

      {loadError ? (
        <DataError onRetry={loadData} />
      ) : (
        <div className="bg-white rounded-xl border border-[#cfe0d8] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f0f7f4]">
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Feature / Screen</th>
                  {allRoles.map(role => (
                    <th key={role} className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[11px] font-bold text-[#6b8878] uppercase">{role}</span>
                        {!BUILT_IN_ROLES.includes(role) && (
                          <button
                            onClick={() => setDeletingRole(role)}
                            className="text-[10px] text-[#dc2626] underline hover:text-[#b91c1c]"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_SCREENS.map(sc => (
                  <tr key={sc.key} className="border-t border-[#cfe0d8]">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-sm text-[#0d4a2c]">{sc.label}</div>
                      <div className="text-[10px] text-[#6b8878]">{sc.key}</div>
                    </td>
                    {allRoles.map(role => (
                      <td key={role} className="px-4 py-3 text-center">
                        <select
                          value={matrix[role]?.[sc.key] || "HIDDEN"}
                          onChange={e => updatePerm(role, sc.key, e.target.value)}
                          className="px-2 py-1 border border-[#cfe0d8] rounded text-xs focus:outline-none focus:border-[#1a7a4a]"
                        >
                          {PERM_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || loadError}
        className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg hover:bg-[#0d4a2c] disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save All Permissions"}
      </button>

      {/* Add Role Modal */}
      {showAddRole && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="px-6 py-4 border-b border-[#cfe0d8] flex items-center justify-between">
              <h2 className="font-['Syne'] text-base font-extrabold text-[#0d4a2c]">Add Custom Role</h2>
              <button onClick={() => setShowAddRole(false)} className="text-xl text-[#6b8878] hover:text-[#1a2e24]">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {addError && <div className="text-sm text-[#dc2626] bg-[#fee2e2] px-4 py-2 rounded-lg">{addError}</div>}
              <div>
                <label className="block text-sm font-semibold mb-1.5">Role Name</label>
                <input
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]"
                  placeholder="e.g. THERAPIST"
                />
                <p className="text-xs text-[#6b8878] mt-1">Uppercase letters, numbers, underscores. All permissions default to HIDDEN.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#cfe0d8] flex gap-3 justify-end">
              <button onClick={() => setShowAddRole(false)} className="px-4 py-2 border border-[#cfe0d8] text-[#6b8878] font-semibold rounded-lg hover:bg-[#f0f7f4]">Cancel</button>
              <button onClick={handleAddRole} className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg hover:bg-[#0d4a2c]">Create Role</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Role Confirmation */}
      {deletingRole && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="px-6 py-4 border-b border-[#cfe0d8]">
              <h2 className="font-['Syne'] text-base font-extrabold text-[#dc2626]">Delete Role</h2>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-[#6b8878]">
                Are you sure you want to delete the role <strong className="text-[#0d4a2c]">{deletingRole}</strong>?
                This cannot be undone.
              </p>
              <p className="text-xs text-[#6b8878]">Built-in roles (ADMIN, CLINICIAN, RECEPTIONIST, FINANCE) cannot be deleted.</p>
            </div>
            <div className="px-6 py-4 border-t border-[#cfe0d8] flex gap-3 justify-end">
              <button onClick={() => setDeletingRole(null)} className="px-4 py-2 border border-[#cfe0d8] text-[#6b8878] font-semibold rounded-lg hover:bg-[#f0f7f4]">Cancel</button>
              <button onClick={() => handleDeleteRole(deletingRole)} className="px-4 py-2 bg-[#dc2626] text-white font-semibold rounded-lg hover:bg-[#b91c1c]">Delete Role</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
