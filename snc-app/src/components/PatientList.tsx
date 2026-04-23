import React, { useState, useEffect } from 'react';
import { getPatients } from '../api';
import TreatmentCard from './TreatmentCard';

interface PatientListProps {
    onEdit: (patient: any) => void;
    onView: (patient: any) => void;
}

const PatientList: React.FC<PatientListProps> = ({ onEdit, onView }) => {
    const [patients, setPatients] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

    useEffect(() => {
        getPatients(search).then(setPatients).catch(() => setPatients([]));
    }, [search]);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Patients Directory</h2>
                <div className="flex gap-4">
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Search patients..." 
                            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                <th className="p-4">Reg. No</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Age/Sex</th>
                                <th className="p-4">Phone</th>
                                <th className="p-4">Conditions</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {patients.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">{p.regNo}</td>
                                    <td className="p-4 font-semibold">{p.name}</td>
                                    <td className="p-4">{p.age} / {p.gender}</td>
                                    <td className="p-4">{p.phone}</td>
                                    <td className="p-4 max-w-xs truncate">{p.conditions}</td>
                                    <td className="p-4 flex gap-2">
                                        <button 
                                            onClick={() => onView(p)}
                                            className="text-white bg-primary px-3 py-1 rounded hover:bg-primary-dark font-semibold transition-colors"
                                        >
                                            View
                                        </button>
                                        <button 
                                            onClick={() => setSelectedPatient(p)}
                                            className="text-slate-600 border px-3 py-1 rounded hover:bg-slate-100"
                                        >
                                            Card
                                        </button>
                                        <button 
                                            onClick={() => onEdit(p)}
                                            className="text-slate-600 border px-3 py-1 rounded hover:bg-slate-100"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedPatient && (
                <TreatmentCard 
                    patient={selectedPatient} 
                    onClose={() => setSelectedPatient(null)} 
                />
            )}
        </div>
    );
};

export default PatientList;
