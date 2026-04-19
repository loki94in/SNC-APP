import { useState, useEffect } from "react";

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    const allPayments = JSON.parse(localStorage.getItem("snc_payments") || "[]");
    const patients = JSON.parse(localStorage.getItem("snc_patients") || "[]");
    setPayments(allPayments.map(p => ({
      ...p,
      patientName: patients.find((pt: any) => pt.id === p.patientId)?.name || "Unknown"
    })).reverse());
  }, []);

  const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Syne'] text-xl font-extrabold text-[#0d4a2c]">Payments</h1>
          <p className="text-sm text-[#6b8878] mt-1">Total: ₹{total.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#cfe0d8] p-5">
          <div className="text-[11px] font-bold text-[#6b8878] uppercase">Cash</div>
          <div className="font-['Syne'] text-2xl font-extrabold text-[#0d4a2c] mt-2">
            ₹{payments.filter(p => p.mode === "CASH").reduce((s, p) => s + p.amount, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#cfe0d8] p-5">
          <div className="text-[11px] font-bold text-[#6b8878] uppercase">UPI</div>
          <div className="font-['Syne'] text-2xl font-extrabold text-[#0d4a2c] mt-2">
            ₹{payments.filter(p => p.mode === "UPI").reduce((s, p) => s + p.amount, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#cfe0d8] p-5">
          <div className="text-[11px] font-bold text-[#6b8878] uppercase">Pending</div>
          <div className="font-['Syne'] text-2xl font-extrabold text-[#dc2626] mt-2">
            ₹{payments.filter(p => p.mode === "PENDING").reduce((s, p) => s + p.amount, 0).toLocaleString()}
          </div>
        </div>
      </div>

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
            {payments.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-[#6b8878]">
                <div className="text-4xl mb-2">💰</div><div>No payments recorded</div>
              </td></tr>
            ) : payments.map(p => (
              <tr key={p.id} className="border-t border-[#cfe0d8] hover:bg-[#f0f7f4]">
                <td className="px-4 py-3 text-sm">{p.date}</td>
                <td className="px-4 py-3 font-semibold">{p.patientName}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${p.mode === "CASH" ? "bg-[#dcfce7] text-[#16a34a]" : p.mode === "UPI" ? "bg-[#dbeafe] text-[#2563eb]" : "bg-[#fee2e2] text-[#dc2626]"}`}>
                    {p.mode}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-[#1a7a4a]">₹{p.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
