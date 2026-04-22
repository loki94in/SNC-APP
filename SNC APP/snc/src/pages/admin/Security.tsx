import { useState, useEffect } from "react";
import { useAuth } from "@/App";
import { api } from "@/lib/api";
import { clearAuth } from "@/lib/api";

interface AuditEntry {
  id: string;
  event: string;
  user_id: string;
  details: string | null;
  created_at: string;
}

export default function Security() {
  const { user } = useAuth();
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [newLoginId, setNewLoginId] = useState("");
  const [loginIdMsg, setLoginIdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Backup / Restore
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMsg, setBackupMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState("");
  const [showRestore, setShowRestore] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importData, setImportData] = useState<any>(null);

  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  useEffect(() => {
    api<{ logs: AuditEntry[] }>("/api/dashboard/audit-log")
      .then(data => setAuditLogs(data.logs || []))
      .catch(() => {})
      .finally(() => setAuditLoading(false));
  }, []);

  // Login Bypass toggle (ADMIN only)
  const [bypassEnabled, setBypassEnabled] = useState(false);
  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    api<{ enabled: boolean }>("/api/config/login-bypass")
      .then(data => setBypassEnabled(data.enabled))
      .catch(() => {});
  }, [user?.role]);

  const toggleBypass = async () => {
    const next = !bypassEnabled;
    try {
      await api("/api/config/login-bypass", { method: "PUT", body: { enabled: next } });
      setBypassEnabled(next);
      setBackupMsg?.({ type: "success", text: next ? "Login bypass ENABLED — app will auto-login on next visit." : "Login bypass DISABLED — login screen required." });
    } catch (err: any) {
      setBackupMsg?.({ type: "error", text: err.message || "Failed" });
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      setMessage({ type: "error", text: "All fields are required" }); return;
    }
    if (newPwd !== confirmPwd) {
      setMessage({ type: "error", text: "New passwords don't match" }); return;
    }
    if (newPwd.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" }); return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await api("/api/auth/change-password", {
        method: "POST",
        body: { currentPassword: currentPwd, newPassword: newPwd },
      });
      setMessage({ type: "success", text: "Password updated successfully!" });
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update password" });
    } finally { setLoading(false); }
  };

  const handleLoginIdChange = async () => {
    if (!newLoginId) { setLoginIdMsg({ type: "error", text: "New login ID is required" }); return; }
    if (!currentPwd) { setLoginIdMsg({ type: "error", text: "Enter current password to authorize" }); return; }
    setLoading(true); setLoginIdMsg(null);
    try {
      await api("/api/auth/login-id", {
        method: "PUT",
        body: { newLoginId, password: currentPwd },
      });
      setLoginIdMsg({ type: "success", text: `Login ID updated. Redirecting to login...` });
      setNewLoginId("");
      setTimeout(() => { clearAuth(); window.location.href = "/login"; }, 2000);
    } catch (err: any) {
      setLoginIdMsg({ type: "error", text: err.message || "Failed to update login ID" });
    } finally { setLoading(false); }
  };

  const handleExportBackup = async () => {
    if (!confirm("Export a full backup of all clinic data?")) return;
    setBackupLoading(true); setBackupMsg(null);
    try {
      const result = await api<{ ok: boolean; backup: string }>("/api/backup/export", {
        method: "POST", body: {},
      });
      const blob = new Blob([result.backup], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `snc-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      URL.revokeObjectURL(url);
      setBackupMsg({ type: "success", text: "Backup downloaded!" });
    } catch (err: any) {
      setBackupMsg({ type: "error", text: err.message || "Export failed" });
    } finally { setBackupLoading(false); }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true); setBackupMsg(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.snapshot) throw new Error("Invalid backup file format");
      setImportData(data);
      setShowRestore(true);
      setBackupMsg({ type: "success", text: `Loaded: ${file.name}. Type "RESTORE" to confirm.` });
    } catch (err: any) {
      setBackupMsg({ type: "error", text: `Failed to read: ${err.message}` });
    } finally { setImporting(false); }
  };

  const handleRestore = async () => {
    if (restoreConfirm !== "RESTORE") {
      setBackupMsg({ type: "error", text: 'Type "RESTORE" to confirm' }); return;
    }
    if (!importData) return;
    setRestoreLoading(true); setBackupMsg(null);
    try {
      await api("/api/backup/import", {
        method: "POST", body: { snapshot: importData.snapshot },
      });
      setBackupMsg({ type: "success", text: "Restore complete! Reloading..." });
      setRestoreConfirm(""); setShowRestore(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setBackupMsg({ type: "error", text: err.message || "Restore failed" });
    } finally { setRestoreLoading(false); }
  };

  const eventBadge = (event: string) => {
    const cls = event === "LOGIN_SUCCESS" ? "bg-[#dcfce7] text-[#16a34a]"
      : event === "LOGIN_FAILED" ? "bg-[#fee2e2] text-[#dc2626]"
      : event === "PASSWORD_CHANGED" || event === "PASSWORD_RESET" ? "bg-[#dbeafe] text-[#2563eb]"
      : "bg-[#f3f4f6] text-[#6b7280]";
    return <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${cls}`}>{event}</span>;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-['Syne'] text-xl font-extrabold text-[#0d4a2c]">Security Settings</h1>
        <p className="text-sm text-[#6b8878] mt-1">Manage passwords, credentials, and data backups</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#fee2e2] text-[#dc2626]"}`}>
          {message.text}
        </div>
      )}

      {backupMsg && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${backupMsg.type === "success" ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#fee2e2] text-[#dc2626]"}`}>
          {backupMsg.text}
        </div>
      )}

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-[#cfe0d8] p-5 space-y-4">
        <h3 className="font-semibold text-[#0d4a2c]">Change Password</h3>
        <div>
          <label className="block text-sm font-semibold mb-1.5">Current Password</label>
          <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">New Password</label>
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Confirm New Password</label>
            <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" />
          </div>
        </div>
        <button onClick={handlePasswordChange} disabled={loading}
          className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg hover:bg-[#0d4a2c] disabled:opacity-50">
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>

      {/* Change Login ID */}
      <div className="bg-white rounded-xl border border-[#cfe0d8] p-5 space-y-4">
        <h3 className="font-semibold text-[#0d4a2c]">Change Login ID</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Current Login ID</label>
            <input value={user?.login_id || ""} readOnly
              className="w-full px-4 py-2.5 border border-[#f3f4f6] rounded-lg text-sm bg-[#f9fafb] text-[#6b8878]" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">New Login ID</label>
            <input value={newLoginId} onChange={e => setNewLoginId(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]"
              placeholder="e.g. dr_rakesh" />
          </div>
        </div>
        <p className="text-xs text-[#6b8878]">Requires current password. Min 5 chars, alphanumeric + underscore.</p>
        <button onClick={handleLoginIdChange} disabled={loading}
          className="px-4 py-2 bg-[#e8a020] text-[#0d4a2c] font-semibold rounded-lg hover:bg-[#d97706] disabled:opacity-50">
          {loading ? "Updating..." : "Update Login ID"}
        </button>
      </div>

      {/* Backup / Restore — Admin only */}
      {user?.role === "ADMIN" && (
        <div className="bg-white rounded-xl border border-[#cfe0d8] p-5 space-y-4">
          <h3 className="font-semibold text-[#0d4a2c]">Backup & Restore</h3>
          <div className="flex gap-3 flex-wrap">
            <button onClick={handleExportBackup} disabled={backupLoading}
              className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg hover:bg-[#0d4a2c] disabled:opacity-50">
              {backupLoading ? "Exporting..." : "Export Backup"}
            </button>
            <label className="px-4 py-2 bg-[#2563eb] text-white font-semibold rounded-lg hover:bg-[#1d4ed8] cursor-pointer disabled:opacity-50">
              {importing ? "Loading..." : "Import Backup"}
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>
          </div>
          {showRestore && (
            <div className="space-y-3 pt-3 border-t border-[#cfe0d8]">
              <p className="text-sm text-[#dc2626] font-semibold">⚠️ This will overwrite ALL current data. Type RESTORE to confirm:</p>
              <div className="flex gap-3 items-center">
                <input value={restoreConfirm} onChange={e => setRestoreConfirm(e.target.value)}
                  placeholder="Type RESTORE"
                  className="flex-1 px-4 py-2.5 border border-[#dc2626] rounded-lg text-sm focus:outline-none" />
                <button onClick={handleRestore} disabled={restoreLoading}
                  className="px-4 py-2 bg-[#dc2626] text-white font-semibold rounded-lg hover:bg-[#b91c1c] disabled:opacity-50">
                  {restoreLoading ? "Restoring..." : "Confirm Restore"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audit Log */}
      {user?.role === "ADMIN" && (
        <div className="bg-white rounded-xl border border-[#cfe0d8] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#cfe0d8]">
            <h3 className="font-semibold text-[#0d4a2c]">Recent Activity</h3>
            <p className="text-xs text-[#6b8878] mt-1">Last 100 system events</p>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-[#f0f7f4]">
                <tr>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Event</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">User</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Details</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Time</th>
                </tr>
              </thead>
              <tbody>
                {auditLoading ? (
                  <tr><td colSpan={4} className="text-center py-8">
                    <div className="h-6 w-24 mx-auto bg-[#f0f7f4] rounded animate-pulse" /></td></tr>
                ) : auditLogs.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-[#6b8878] text-sm">No activity recorded yet</td></tr>
                ) : auditLogs.map(log => (
                  <tr key={log.id} className="border-t border-[#cfe0d8] hover:bg-[#f0f7f4]">
                    <td className="px-4 py-2.5">{eventBadge(log.event)}</td>
                    <td className="px-4 py-2.5 text-xs text-[#6b8878]">{log.user_id || "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-[#6b8878] max-w-xs truncate">{log.details || "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-[#6b8878]">{log.created_at ? log.created_at.replace("T", " ").slice(0, 19) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
