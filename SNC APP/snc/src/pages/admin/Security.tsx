import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface AuditEntry {
  id: string;
  event: string;
  user_id: string;
  details: string | null;
  created_at: string;
}

export default function Security() {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);

  useEffect(() => {
    api<{ logs: AuditEntry[] }>("/api/dashboard/audit-log")
      .then(data => setAuditLogs(data.logs || []))
      .catch(() => {})
      .finally(() => setAuditLoading(false));
  }, []);

  const handlePasswordChange = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      setMessage({ type: "error", text: "All fields are required" });
      return;
    }
    if (newPwd !== confirmPwd) {
      setMessage({ type: "error", text: "New passwords don't match" });
      return;
    }
    if (newPwd.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await api("/api/auth/change-password", {
        method: "POST",
        body: { currentPassword: currentPwd, newPassword: newPwd },
      });
      setMessage({ type: "success", text: "Password updated successfully!" });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update password" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-['Syne'] text-xl font-extrabold text-[#0d4a2c]">Security Settings</h1>
        <p className="text-sm text-[#6b8878] mt-1">Manage passwords and login credentials</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
          message.type === "success" ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#fee2e2] text-[#dc2626]"
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#cfe0d8] p-5 space-y-4">
        <h3 className="font-semibold text-[#0d4a2c]">Change Password</h3>
        <div>
          <label className="block text-sm font-semibold mb-1.5">Current Password</label>
          <input
            type="password"
            value={currentPwd}
            onChange={e => setCurrentPwd(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">New Password</label>
            <input
              type="password"
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]"
            />
          </div>
        </div>
        <button
          onClick={handlePasswordChange}
          disabled={loading}
          className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg hover:bg-[#0d4a2c] disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>

      {/* Audit Log — visible only to ADMIN */}
      <div className="bg-white rounded-xl border border-[#cfe0d8] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#cfe0d8]">
          <h3 className="font-semibold text-[#0d4a2c]">Recent Activity</h3>
          <p className="text-xs text-[#6b8878] mt-1">Last 100 system events — login, logout, record changes</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f0f7f4]">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Event</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">User</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Details</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Time</th>
              </tr>
            </thead>
            <tbody>
              {auditLoading ? (
                <tr><td colSpan={4} className="text-center py-8"><div className="h-6 w-24 mx-auto bg-[#f0f7f4] rounded animate-pulse" /></td></tr>
              ) : auditLogs.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-[#6b8878] text-sm">No activity recorded yet</td></tr>
              ) : auditLogs.map(log => (
                <tr key={log.id} className="border-t border-[#cfe0d8] hover:bg-[#f0f7f4]">
                  <td className="px-4 py-2.5 text-xs font-mono">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      log.event === "LOGIN_SUCCESS" ? "bg-[#dcfce7] text-[#16a34a]"
                      : log.event === "LOGIN_FAILED" ? "bg-[#fee2e2] text-[#dc2626]"
                      : log.event === "PASSWORD_CHANGED" ? "bg-[#dbeafe] text-[#2563eb]"
                      : "bg-[#f3f4f6] text-[#6b7280]"
                    }`}>{log.event}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[#6b8878]">{log.user_id || "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-[#6b8878] max-w-xs truncate">{log.details || "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-[#6b8878]">{log.created_at ? log.created_at.replace("T", " ").slice(0, 19) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}