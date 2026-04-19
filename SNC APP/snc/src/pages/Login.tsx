import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

const CLINICS = [
  { value: "agra-main", label: "Agra Main Center" },
];

interface LoginProps {
  auth?: {
    isAuthenticated: boolean;
    login: (password: string) => boolean;
    logout: () => void;
  };
}

export default function Login({ auth }: LoginProps) {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [clinic] = useState("agra-main");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId || !password) {
      setError("Login ID and password are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await api<{ token: string; user: any; mustChangePassword: boolean }>("/api/auth/login", {
        method: "POST",
        body: { loginId, password },
      });
      localStorage.setItem("snc_token", data.token);
      localStorage.setItem("snc_user", JSON.stringify(data.user));
      if (data.mustChangePassword) {
        navigate("/admin/security");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d4a2c] via-[#1e6640] to-[#1a7a4a]">
      <div className="bg-white rounded-2xl p-10 w-full max-w-[400px] shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#0d4a2c] to-[#1a7a4a] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-3xl">
            🏥
          </div>
          <h2 className="font-['Syne'] text-2xl font-extrabold text-[#0d4a2c]">SNC</h2>
          <p className="text-sm text-[#6b8878] mt-1">Siyaram Neurotherapy Center</p>
          <span className="inline-block mt-3 text-xs font-bold text-[#e8a020] bg-[#fef3d8] px-3 py-1 rounded-full">
            Agra Main Center
          </span>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-[#1a2e24] mb-1.5">Login ID</label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-[#cfe0d8] rounded-lg text-sm transition-all focus:outline-none focus:border-[#1a7a4a] focus:shadow-[0_0_0_3px_rgba(26,122,74,0.1)]"
              placeholder="Enter login ID"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-[#1a2e24] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-[#cfe0d8] rounded-lg text-sm transition-all focus:outline-none focus:border-[#1a7a4a] focus:shadow-[0_0_0_3px_rgba(26,122,74,0.1)]"
              placeholder="Enter password"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#1a2e24] mb-1.5">Clinic</label>
            <select
              value={clinic}
              onChange={(e) => setClinic(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]"
            >
              {CLINICS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="mb-4 text-sm text-[#e53e3e] bg-[#fee2e2] px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-[#1a7a4a] hover:bg-[#0d4a2c] text-white font-semibold rounded-lg transition-colors"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-xs text-[#6b8878] mt-6">
          Demo: admin / admin123
        </p>
      </div>
    </div>
  );
}
