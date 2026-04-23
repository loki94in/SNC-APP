import React, { useState, useEffect } from 'react';
import { getSessions, logSession, recordPayment, getPayments } from '../api';

interface PatientDetailProps {
    patient: any;
    onBack: () => void;
}

const PatientDetail: React.FC<PatientDetailProps> = ({ patient, onBack }) => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'sessions' | 'payments'>('sessions');
    const [showSessionForm, setShowSessionForm] = useState(false);
    const [showPaymentForm, setShowPaymentForm] = useState(false);

    // Form States
    const [newSession, setNewSession] = useState({ assessment: '', painLevel: 5, mobility: 'Normal', techniques: '' });
    const [newPayment, setNewPayment] = useState({ amount: '', method: 'Cash', status: 'PAID' });

    useEffect(() => {
        getSessions(patient.id).then(setSessions);
        getPayments().then(all => setPayments(all.filter((p: any) => p.patientId === patient.id)));
    }, [patient.id]);

    const handleAddSession = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await logSession({
                patientId: patient.id,
                ...newSession,
                techniques: newSession.techniques.split(',').map(t => t.trim())
            });
            setShowSessionForm(false);
            getSessions(patient.id).then(setSessions);
        } catch (err) {
            alert('Failed to log session');
        }
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await recordPayment({
                patientId: patient.id,
                amount: Number(newPayment.amount),
                method: newPayment.method,
                status: newPayment.status
            });
            setShowPaymentForm(false);
            getPayments().then(all => setPayments(all.filter((p: any) => p.patientId === patient.id)));
        } catch (err) {
            alert('Failed to record payment');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="text-slate-400 hover:text-slate-600 p-2">← Back</button>
                <h2 className="text-3xl font-bold">{patient.name} <span className="text-slate-400 text-lg font-normal ml-2">({patient.regNo})</span></h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1 bg-white rounded-2xl shadow-sm border p-6 h-fit">
                    <h3 className="text-xs font-bold uppercase text-slate-500 mb-4 tracking-widest">Patient Profile</h3>
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-slate-500">Age / Sex</span>
                            <span className="font-semibold">{patient.age} / {patient.gender}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-slate-500">Phone</span>
                            <span className="font-semibold">{patient.phone}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block mb-1">Conditions</span>
                            <div className="flex flex-wrap gap-1">
                                {JSON.parse(patient.conditions || '[]').map((c: string) => (
                                    <span key={c} className="bg-primary-light text-primary-dark px-2 py-0.5 rounded text-[10px] font-bold uppercase">{c}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Section */}
                <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border flex flex-col min-h-[500px]">
                    <div className="flex border-b">
                        <button 
                            onClick={() => setActiveTab('sessions')}
                            className={`px-8 py-4 font-bold text-sm transition-colors ${activeTab === 'sessions' ? 'border-b-2 border-primary text-primary' : 'text-slate-400'}`}
                        >
                            Sessions
                        </button>
                        <button 
                            onClick={() => setActiveTab('payments')}
                            className={`px-8 py-4 font-bold text-sm transition-colors ${activeTab === 'payments' ? 'border-b-2 border-primary text-primary' : 'text-slate-400'}`}
                        >
                            Payments
                        </button>
                    </div>

                    <div className="p-6 flex-grow">
                        {activeTab === 'sessions' ? (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-bold text-slate-700">Treatment History</h4>
                                    <button 
                                        onClick={() => setShowSessionForm(true)}
                                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold"
                                    >
                                        + New Session
                                    </button>
                                </div>
                                
                                <div className="space-y-4">
                                    {sessions.map(s => (
                                        <div key={s.id} className="border rounded-xl p-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex justify-between mb-2">
                                                <span className="font-bold text-slate-800">{new Date(s.date).toLocaleDateString()}</span>
                                                <span className="text-primary font-bold">{s.painLevel}/10 Pain</span>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-2">{s.assessment}</p>
                                            <div className="text-xs text-slate-400 italic">Techniques: {Array.isArray(JSON.parse(s.techniques || '[]')) ? JSON.parse(s.techniques).join(', ') : s.techniques}</div>
                                        </div>
                                    ))}
                                    {sessions.length === 0 && <p className="text-center py-10 text-slate-400 italic">No sessions recorded yet.</p>}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-bold text-slate-700">Financial History</h4>
                                    <button 
                                        onClick={() => setShowPaymentForm(true)}
                                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold"
                                    >
                                        + Record Payment
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {payments.map(p => (
                                        <div key={p.id} className="border rounded-xl p-4 flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-lg">₹{p.amount}</div>
                                                <div className="text-xs text-slate-400">{new Date(p.date).toLocaleDateString()} via {p.method}</div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${p.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {p.status}
                                            </span>
                                        </div>
                                    ))}
                                    {payments.length === 0 && <p className="text-center py-10 text-slate-400 italic">No payments recorded yet.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Session Modal */}
            {showSessionForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-xl shadow-2xl">
                        <h3 className="text-xl font-bold mb-6">Log Treatment Session</h3>
                        <form onSubmit={handleAddSession} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-500">Clinical Assessment</label>
                                <textarea 
                                    required className="w-full p-3 border rounded-xl" rows={3}
                                    value={newSession.assessment}
                                    onChange={e => setNewSession({...newSession, assessment: e.target.value})}
                                ></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-slate-500">Pain Level (1-10)</label>
                                    <input 
                                        type="number" min="1" max="10" className="w-full p-3 border rounded-xl"
                                        value={newSession.painLevel}
                                        onChange={e => setNewSession({...newSession, painLevel: Number(e.target.value)})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-slate-500">Mobility</label>
                                    <select 
                                        className="w-full p-3 border rounded-xl"
                                        value={newSession.mobility}
                                        onChange={e => setNewSession({...newSession, mobility: e.target.value})}
                                    >
                                        <option>Normal</option>
                                        <option>Restricted</option>
                                        <option>Severely Restricted</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-500">Techniques Used (comma separated)</label>
                                <input 
                                    type="text" className="w-full p-3 border rounded-xl" placeholder="e.g. Navel Setting, Back Massage"
                                    value={newSession.techniques}
                                    onChange={e => setNewSession({...newSession, techniques: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowSessionForm(false)} className="flex-grow border py-3 rounded-xl font-bold">Cancel</button>
                                <button type="submit" className="flex-grow bg-primary text-white py-3 rounded-xl font-bold">Save Session</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-6">Record Payment</h3>
                        <form onSubmit={handleAddPayment} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-500">Amount (₹)</label>
                                <input 
                                    type="number" required className="w-full p-3 border rounded-xl text-2xl font-bold"
                                    value={newPayment.amount}
                                    onChange={e => setNewPayment({...newPayment, amount: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-500">Method</label>
                                <select 
                                    className="w-full p-3 border rounded-xl"
                                    value={newPayment.method}
                                    onChange={e => setNewPayment({...newPayment, method: e.target.value})}
                                >
                                    <option>Cash</option>
                                    <option>UPI</option>
                                    <option>Card</option>
                                    <option>Transfer</option>
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowPaymentForm(false)} className="flex-grow border py-3 rounded-xl font-bold">Cancel</button>
                                <button type="submit" className="flex-grow bg-primary text-white py-3 rounded-xl font-bold">Record Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientDetail;
