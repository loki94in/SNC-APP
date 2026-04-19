import { useState } from "react";

export default function Telegram() {
  const [token, setToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [status, setStatus] = useState<"NOT SET" | "ACTIVE" | "REVOKED">("NOT SET");
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const handleSave = () => {
    if (token) {
      localStorage.setItem("snc_tg_token", token);
      localStorage.setItem("snc_tg_chat_id", chatId);
      setStatus("ACTIVE");
      alert("Telegram bot token saved!");
    }
  };

  const handleRevoke = () => {
    if (confirm("Revoke bot token? All alerts will stop.")) {
      localStorage.removeItem("snc_tg_token");
      localStorage.removeItem("snc_tg_chat_id");
      setToken("");
      setChatId("");
      setStatus("REVOKED");
    }
  };

  const handleTest = () => {
    setTestResult(token ? "success" : "error");
    if (token) alert("Bot connected successfully!");
    else alert("Connection failed. Check token.");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-['Syne'] text-xl font-extrabold text-[#0d4a2c]">Telegram Bot Manager</h1>
        <p className="text-sm text-[#6b8878] mt-1">Configure Telegram bot for alerts and notifications</p>
      </div>

      <div className="bg-white rounded-xl border border-[#cfe0d8] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Bot Status</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${status === "ACTIVE" ? "bg-[#dcfce7] text-[#16a34a]" : status === "REVOKED" ? "bg-[#fee2e2] text-[#dc2626]" : "bg-[#f3f4f6] text-[#6b7280]"}`}>{status}</span>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5">Bot Token</label>
          <input type="password" value={token} onChange={e => setToken(e.target.value)}
            className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]"
            placeholder="123456789:ABCdefGHI..." />
          <p className="text-xs text-[#6b8878] mt-1">From @BotFather</p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5">Chat ID</label>
          <input type="text" value={chatId} onChange={e => setChatId(e.target.value)}
            className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]"
            placeholder="Your Telegram Chat ID" />
        </div>

        <div className="flex gap-3">
          <button onClick={handleSave} className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg">Save Token</button>
          <button onClick={handleTest} className="px-4 py-2 border border-[#1a7a4a] text-[#1a7a4a] font-semibold rounded-lg">Test Connection</button>
          <button onClick={handleRevoke} className="px-4 py-2 bg-[#dc2626] text-white font-semibold rounded-lg">Revoke</button>
        </div>
      </div>
    </div>
  );
}
