import { useState, useEffect } from "react";
import { api } from "@/lib/api";

type Status = "NOT_SET" | "ACTIVE" | "REVOKED";

interface TgConfig {
  status: string;
  chat_id: string | null;
  alert_backup: number;
  alert_login_fail: number;
  alert_time: string;
}

export default function Telegram() {
  const [token, setToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [status, setStatus] = useState<Status>("NOT_SET");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    api<{ config: TgConfig | null }>("/api/telegram/config")
      .then(data => {
        if (data.config) {
          setStatus(data.config.status as Status);
          setChatId(data.config.chat_id || "");
          setMessage(null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!token) { setMessage({ type: "error", text: "Bot token is required" }); return; }
    setSaving(true);
    setMessage(null);
    try {
      const result = await api<{ ok: boolean; bot?: string }>("/api/telegram/token", {
        method: "POST",
        body: { token, chatId },
      });
      setStatus("ACTIVE");
      setMessage({ type: "success", text: `Bot @${result.bot} connected successfully!` });
      setToken("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save token" });
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm("Revoke bot token? All alerts will stop.")) return;
    setSaving(true);
    setMessage(null);
    try {
      await api("/api/telegram/revoke", { method: "POST" });
      setStatus("REVOKED");
      setToken("");
      setChatId("");
      setMessage({ type: "success", text: "Bot token revoked." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to revoke" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-['Syne'] text-xl font-extrabold text-[#0d4a2c]">Telegram Bot Manager</h1>
        <p className="text-sm text-[#6b8878] mt-1">Configure Telegram bot for alerts and notifications</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#fee2e2] text-[#dc2626]"}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#cfe0d8] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Bot Status</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            status === "ACTIVE" ? "bg-[#dcfce7] text-[#16a34a]"
            : status === "REVOKED" ? "bg-[#fee2e2] text-[#dc2626]"
            : "bg-[#f3f4f6] text-[#6b7280]"
          }`}>{status}</span>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5">Bot Token</label>
          <input type="password" value={token} onChange={e => setToken(e.target.value)}
            className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]"
            placeholder="123456789:ABCdefGHI..." disabled={saving} />
          <p className="text-xs text-[#6b8878] mt-1">From @BotFather</p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5">Chat ID</label>
          <input type="text" value={chatId} onChange={e => setChatId(e.target.value)}
            className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]"
            placeholder="Your Telegram Chat ID" disabled={saving} />
        </div>

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving || !token}
            className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg hover:bg-[#0d4a2c] disabled:opacity-50">
            {saving ? "Saving..." : "Save Token"}
          </button>
          <button onClick={handleRevoke} disabled={saving}
            className="px-4 py-2 bg-[#dc2626] text-white font-semibold rounded-lg hover:bg-[#b91c1c] disabled:opacity-50">
            Revoke
          </button>
        </div>
      </div>
    </div>
  );
}
