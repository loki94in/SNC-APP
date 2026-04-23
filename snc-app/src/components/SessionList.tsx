import React, { useState, useEffect } from 'react';
import { getAllSessions } from '../api';

const SessionList: React.FC = () => {
    const [sessions, setSessions] = useState<any[]>([]);

    useEffect(() => {
        getAllSessions().then(setSessions);
    }, []);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-8">Treatment Sessions</h2>
            <div className="bg-white rounded-xl shadow-sm border">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                <th className="p-4">Date</th>
                                <th className="p-4">Patient</th>
                                <th className="p-4">Assessment</th>
                                <th className="p-4">Pain Level</th>
                                <th className="p-4">Mobility</th>
                                <th className="p-4">Technique</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {sessions.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">{new Date(s.date).toLocaleDateString()}</td>
                                    <td className="p-4 font-semibold">{s.patientName}</td>
                                    <td className="p-4">{s.assessment}</td>
                                    <td className="p-4">
                                        <span className={`font-bold ${s.painLevel > 6 ? 'text-red-500' : 'text-green-500'}`}>
                                            {s.painLevel}/10
                                        </span>
                                    </td>
                                    <td className="p-4">{s.mobility}</td>
                                    <td className="p-4 max-w-xs truncate">{s.techniques}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SessionList;
