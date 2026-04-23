import React, { useState, useEffect } from 'react';
import { getPayments } from '../api';

const PaymentList: React.FC = () => {
    const [payments, setPayments] = useState<any[]>([]);

    useEffect(() => {
        getPayments().then(setPayments);
    }, []);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-8">Payment History</h2>
            <div className="bg-white rounded-xl shadow-sm border">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                <th className="p-4">Date</th>
                                <th className="p-4">Patient</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Method</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {payments.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">{new Date(p.date).toLocaleDateString()}</td>
                                    <td className="p-4 font-semibold">{p.patientName}</td>
                                    <td className="p-4">₹{p.amount}</td>
                                    <td className="p-4 uppercase text-xs font-semibold text-slate-500">{p.method}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${p.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button className="text-slate-600 border px-3 py-1 rounded hover:bg-slate-100">PDF</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PaymentList;
