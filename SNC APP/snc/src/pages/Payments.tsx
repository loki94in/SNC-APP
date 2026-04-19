import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { usePermission } from "@/App";
import NoAccess from "@/components/NoAccess";

interface Payment {
  id: string;
  patient_id: string;
  session_id: string | null;
  amount: number;
  mode: string;
  notes: string;
  created_at: string;
  patient_name: string | null;
}

function DataError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-[#fee2e2] p-8 text-center">
      <div className="text-3xl mb-2">⚠️</div>
      <div className="font-semibold text-[#dc2626] mb-1">Failed to load payments</div>
      <div className="text-sm text-[#6b8878] mb-4">Could not reach the server.</div>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg hover:bg-[#0d4a2c] text-sm"
      >
        Try Again
      </button>
    </div>
  );
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { canView, canEdit } = usePermission("payments");

  const loadPayments = () => {
    setLoading(true);
    setLoadError(false);
    api<{ payments: Payment[] }>("/api/payments/")
      .then(data => setPayments(data.payments || []))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPayments(); }, []);

  const cashTotal = payments.filter(p => p.mode === "CASH").reduce((s, p) => s + (p.amount || 0), 0);
  const upiTotal   = payments.filter(p => p.mode === "UPI").reduce((s, p) => s + (p.amount || 0), 0);
  const pendingTotal = payments.filter(p => p.mode === "PENDING").reduce((s, p) => s + (p.amount || 0), 0);
  const grandTotal = cashTotal + upiTotal + pendingTotal;

  if (!canView) return <NoAccess message="Access Restricted" detail="You do not have permission to view payments." />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-['Syne'] text-xl font-extrabold text-[#0d4a2c]">Payments</h1>
        <p className="text-sm text-[#6b8878] mt-1">
          {loading ? "..."
            : loadError ? "Load failed"
            : `Total: ₹${grandTotal.toLocaleString()}`}
        </p>
      </div>

      {/* Summary cards — always visible once data loads */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#cfe0d8] p-5">
          <div className="text-[11px] font-bold text-[#6b8878] uppercase">Cash</div>
          <div className="font-['Syne'] text-2xl font-extrabold text-[#0d4a2c] mt-2">
            {loading ? "—" : `₹${cashTotal.toLocaleString()}`}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#cfe0d8] p-5">
          <div className="text-[11px] font-bold text-[#6b8878] uppercase">UPI</div>
          <div className="font-['Syne'] text-2xl font-extrabold text-[#0d4a2c] mt-2">
            {loading ? "—" : `₹${upiTotal.toLocaleString()}`}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#cfe0d8] p-5">
          <div className="text-[11px] font-bold text-[#6b8878] uppercase">Pending</div>
          <div className="font-['Syne'] text-2xl font-extrabold text-[#dc2626] mt-2">
            {loading ? "—" : `₹${pendingTotal.toLocaleString()}`}
          </div>
        </div>
      </div>

      {/* Table */}
      {loadError ? (
        <DataError onRetry={loadPayments} />
      ) : (
        <div className="bg-white rounded-xl border border-[#cfe0d8] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f0f7f4]">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Date</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Patient</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Mode</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6b8878] uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-12">
                  <div className="h-6 w-32 mx-auto bg-[#f0f7f4] rounded animate-pulse" />
                </td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-[#6b8878]">
                  <div className="text-4xl mb-2">💰</div>
                  <div className="font-medium">No payments recorded</div>
                  <div className="text-sm mt-1">Payments appear here once sessions are logged.</div>
                </td></tr>
              ) : payments.map(p => (
                <tr key={p.id} className="border-t border-[#cfe0d8] hover:bg-[#f0f7f4]">
                  <td className="px-4 py-3 text-sm">{p.created_at ? p.created_at.split("T")[0] : "—"}</td>
                  <td className="px-4 py-3 font-semibold text-sm">{p.patient_name || p.patient_id || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      p.mode === "CASH" ? "bg-[#dcfce7] text-[#16a34a]"
                      : p.mode === "UPI" ? "bg-[#dbeafe] text-[#2563eb]"
                      : "bg-[#fee2e2] text-[#dc2626]"
                    }`}>{p.mode}</span>
                  </td>
                  <td className="px-4 py-3 font-bold text-[#1a7a4a]">₹{p.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
