import React, { useState, useEffect } from 'react';
import { getPatients } from '../api';

const Dashboard: React.FC<{ onNavigate: (screen: string) => void }> = ({ onNavigate }) => {
    const [recentPatients, setRecentPatients] = useState<any[]>([]);

    useEffect(() => {
        getPatients().then(data => setRecentPatients(data.slice(0, 5)));
    }, []);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Welcome back, Admin</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-primary">
                    <h3 className="text-slate-500 text-xs uppercase font-semibold tracking-wider mb-2">Total Patients</h3>
                    <div className="text-3xl font-bold">1,248</div>
                    <div className="text-primary text-xs mt-2">↑ 12% this month</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                    <h3 className="text-slate-500 text-xs uppercase font-semibold tracking-wider mb-2">Sessions Today</h3>
                    <div className="text-3xl font-bold">24</div>
                    <div className="text-slate-400 text-xs mt-2">8 scheduled remaining</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
                    <h3 className="text-slate-500 text-xs uppercase font-semibold tracking-wider mb-2">Revenue (MTD)</h3>
                    <div className="text-3xl font-bold">₹45,600</div>
                    <div className="text-slate-400 text-xs mt-2">Target: ₹60,000</div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Recent Patients</h3>
                    <button 
                        onClick={() => onNavigate('add-patient')}
                        className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                    >
                        + New Patient
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                <th className="p-4">Reg. No</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Phone</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {recentPatients.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">{p.regNo}</td>
                                    <td className="p-4 font-semibold">{p.name}</td>
                                    <td className="p-4">{p.phone}</td>
                                    <td className="p-4">
                                        <span className="bg-primary-light text-primary-dark px-3 py-1 rounded-full text-xs font-semibold">
                                            Completed
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button className="text-slate-600 border px-3 py-1 rounded hover:bg-slate-100">View</button>
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

export default Dashboard;
