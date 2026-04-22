import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/App";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [bypassEnabled, setBypassEnabled] = useState(false);

  // Check bypass flag on mount
  useEffect(() => {
    api<{ enabled: boolean }>("/api/config/login-bypass")
      .then(data => {
        if (data.enabled) {
          bypassAutoLogin();
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const bypassAutoLogin = async () => {
    try {
      await api("/api/auth/bypass-login", { method: "POST" });
      navigate("/");
    } catch {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId || !password) { setError("Login ID and password required"); return; }
    setLoading(true);
    setError("");
    try {
      await login(loginId, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d4a2c] via-[#1e6640] to-[#1a7a4a]">
        <div className="text-white font-semibold animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d4a2c] via-[#1e6640] to-[#1a7a4a]">
      <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#0d4a2c] to-[#1a7a4a] rounded-2xl flex items-center justify-center mb-4 shadow-lg text-3xl">🏥</div>
          <h2 className="font-['Syne'] text-2xl font-extrabold text-[#0d4a2c]">SNC Patient Register</h2>
          <p className="text-sm text-[#6b8878] mt-1">Siyaram Neurotherapy Center</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="text-sm text-[#dc2626] bg-[#fee2e2] px-4 py-2 rounded-lg">{error}</div>
          )}
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-[#1a2e24]">Login ID</label>
            <input value={loginId} onChange={e => setLoginId(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" placeholder="Enter login ID" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-[#1a2e24]">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" placeholder="Enter password" />
          </div>
          <button type="submit"
            className="w-full py-2.5 bg-[#1a7a4a] hover:bg-[#0d4a2c] text-white font-semibold rounded-lg transition-colors">
            Sign In
          </button>
        </form>
        <p className="text-center text-xs text-[#6b8878] mt-6">Demo: <code className="bg-[#f0f7f4] px-1 py-0.5 rounded">admin</code> / <code className="bg-[#f0f7f4] px-1 py-0.5 rounded">admin123</code></p>
      </div>
    </div>
  );
}
