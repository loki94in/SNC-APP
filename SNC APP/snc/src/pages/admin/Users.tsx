import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/App";
import NoAccess from "@/components/NoAccess";
import { emitAppEvent } from "@/lib/appEvents";

interface User {
  id: string;
  login_id: string;
  name: string;
  role: string;
  active: number;
  must_change_password: number;
  created_at: string;
}

export default function Users() {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [tempPassword, setTempPassword] = useState("");
  const [tempShow, setTempShow] = useState(false);

  // Create form
  const [form, setForm] = useState({ loginId: "", password: "", name: "", role: "RECEPTIONIST" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const ROLES = ["ADMIN", "CLINICIAN", "RECEPTIONIST", "FINANCE"];

  const loadUsers = () => {
    setLoading(true);
    setLoadError(false);
    api<{ users: User[] }>("/api/auth/users")
      .then(data => setUsers(data.users || []))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async () => {
    if (!form.loginId || !form.password || !form.name) {
      setCreateError("All fields are required");
      return;
    }
    if (form.password.length < 8) {
      setCreateError("Password must be at least 8 characters");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      await api("/api/auth/users", {
        method: "POST",
        body: form,
      });
      setShowCreate(false);
      setForm({ loginId: "", password: "", name: "", role: "RECEPTIONIST" });
      loadUsers();
      emitAppEvent("app:users-changed");
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete user "${user.name}" (${user.login_id})?`)) return;
    try {
      await api(`/api/auth/users/${user.id}`, { method: "DELETE" });
      loadUsers();
      emitAppEvent("app:users-changed");
    } catch (err: any) {
      alert(err.message || "Failed to delete user");
    }
  };

  const handleReset = async (user: User) => {
    setResetTarget(user);
    setTempPassword("");
    setTempShow(false);
    try {
      const data = await api<{ ok: boolean; tempPassword: string }>(`/api/auth/users/${user.id}/reset-password`, {
        method: "POST",
      });
      setTempPassword(data.tempPassword || "");
    } catch (err: any) {
      alert(err.message || "Failed to reset password");
      setResetTarget(null);
    }
  };

  if (authUser?.role !== "ADMIN") return <NoAccess message="Admin Only" detail="User management is only accessible to administrators." />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Syne'] text-xl font-extrabold text-[#0d4a2c]">User Management</h1>
          <p className="text-sm text-[#6b8878] mt-1">
            {loading ? "..." : `${users.length} user${users.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a7a4a] hover:bg-[#0d4a2c] text-white font-semibold rounded-lg transition-colors text-sm"
        >
          + Add User
        </button>
      </div>

      {loadError ? (
        <div className="bg-white rounded-xl border border-[#fee2e2] p-8 text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <div className="font-semibold text-[#dc2626] mb-1">Failed to load users</div>
          <button onClick={loadUsers} className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg hover:bg-[#0d4a2c] text-sm mt-3">
            Try Again
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#cfe0d8] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f0f7f4]">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Name</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Login ID</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Role</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12"><div className="h-6 w-24 mx-auto bg-[#f0f7f4] rounded animate-pulse" /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-[#6b8878]">
                  <div className="text-4xl mb-2">👤</div><div className="font-medium">No users found</div>
                </td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="border-t border-[#cfe0d8] hover:bg-[#f0f7f4] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-sm">{u.name}</div>
                    <div className="text-xs text-[#6b8878]">{u.created_at ? u.created_at.slice(0, 10) : "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono">{u.login_id}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-[#dbeafe] text-[#2563eb] rounded-full text-[11px] font-bold">{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${u.active ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#f3f4f6] text-[#6b7280]"}`}>
                        {u.active ? "Active" : "Inactive"}
                      </span>
                      {u.must_change_password === 1 && (
                        <span className="px-2 py-0.5 bg-[#fef3c7] text-[#d97706] rounded-full text-[11px] font-bold">
                          Must change pass
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReset(u)}
                        className="px-3 py-1 border border-[#e8a020] text-[#e8a020] font-semibold rounded-lg text-xs hover:bg-[#fef3c7] transition-colors"
                      >
                        Reset Pass
                      </button>
                      {u.id !== authUser?.id && (
                        <button
                          onClick={() => handleDelete(u)}
                          className="px-3 py-1 border border-[#dc2626] text-[#dc2626] font-semibold rounded-lg text-xs hover:bg-[#fee2e2] transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-[#cfe0d8] flex items-center justify-between">
              <h2 className="font-['Syne'] text-base font-extrabold text-[#0d4a2c]">Add User</h2>
              <button onClick={() => setShowCreate(false)} className="text-xl text-[#6b8878] hover:text-[#1a2e24]">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {createError && <div className="text-sm text-[#dc2626] bg-[#fee2e2] px-4 py-2 rounded-lg">{createError}</div>}
              <div>
                <label className="block text-sm font-semibold mb-1.5">Full Name *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" placeholder="e.g. Dr. Rakesh" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Login ID *</label>
                <input value={form.loginId} onChange={e => setForm({...form, loginId: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" placeholder="e.g. dr_rakesh" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Password *</label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" placeholder="Min 8 characters" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Role *</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#cfe0d8] flex gap-3 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-[#cfe0d8] text-[#6b8878] font-semibold rounded-lg hover:bg-[#f0f7f4]">Cancel</button>
              <button onClick={handleCreate} disabled={creating}
                className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg hover:bg-[#0d4a2c] disabled:opacity-50">
                {creating ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="px-6 py-4 border-b border-[#cfe0d8]">
              <h2 className="font-['Syne'] text-base font-extrabold text-[#0d4a2c]">Password Reset</h2>
              <p className="text-sm text-[#6b8878] mt-1">For: {resetTarget.name} ({resetTarget.login_id})</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-[#6b8878]">
                A temporary password has been generated. Share it securely with the user — it will not be stored in plain text.
              </div>
              {tempPassword && (
                <div className="bg-[#fef3c7] border border-[#e8a020] rounded-lg p-4 text-center">
                  <div className="text-xs font-bold text-[#d97706] uppercase mb-2">Temporary Password</div>
                  {!tempShow ? (
                    <div className="flex items-center justify-center gap-3">
                      <span className="font-mono font-bold text-lg tracking-widest text-[#0d4a2c]">{"•".repeat(tempPassword.length)}</span>
                      <button onClick={() => setTempShow(true)} className="text-xs text-[#1a7a4a] underline">Show</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <span className="font-mono font-bold text-lg tracking-widest text-[#0d4a2c]">{tempPassword}</span>
                      <button onClick={() => setTempShow(false)} className="text-xs text-[#6b8878] underline">Hide</button>
                    </div>
                  )}
                </div>
              )}
              <div className="text-xs text-[#dc2626]">User must change password on next login.</div>
            </div>
            <div className="px-6 py-4 border-t border-[#cfe0d8] flex justify-end">
              <button onClick={() => setResetTarget(null)}
                className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg hover:bg-[#0d4a2c]">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
