import React from 'react';

interface TreatmentCardProps {
    patient: any;
    onClose: () => void;
}

const TreatmentCard: React.FC<TreatmentCardProps> = ({ patient, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-8 z-50 print:p-0 print:static print:bg-white">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl print:max-h-none print:shadow-none print:rounded-none">
                {/* Modal Header (Hidden on print) */}
                <div className="p-4 border-b flex justify-end gap-4 print:hidden sticky top-0 bg-white z-10">
                    <button 
                        onClick={() => window.print()}
                        className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-dark"
                    >
                        Print Card
                    </button>
                    <button 
                        onClick={onClose}
                        className="border px-6 py-2 rounded-lg font-semibold hover:bg-slate-50"
                    >
                        Close
                    </button>
                </div>

                {/* Printable Content */}
                <div className="p-10 border-4 border-black m-4 print:m-0 print:border-2">
                    <div className="text-center border-b-2 border-black pb-4 mb-6">
                        <h2 className="text-3xl font-bold uppercase tracking-tight">Siya Ram Neurotherapy Center</h2>
                        <p className="text-sm mt-1">Reg. No.: 2018293 | Neurotherapist: Pt. Pradeep Kumar</p>
                        <p className="text-xs">Address: [Clinic Address] | Phone: 9812345678</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
                        <div className="space-y-2">
                            <p><strong>Patient Name:</strong> <span className="border-b border-black inline-block min-w-[200px]">{patient.name}</span></p>
                            <p><strong>Address:</strong> <span className="border-b border-black inline-block min-w-[200px]">{patient.address}</span></p>
                        </div>
                        <div className="space-y-2">
                            <p><strong>Age / Sex:</strong> <span className="border-b border-black inline-block min-w-[100px]">{patient.age} / {patient.gender}</span></p>
                            <p><strong>Telephone:</strong> <span className="border-b border-black inline-block min-w-[200px]">{patient.phone}</span></p>
                            <p><strong>Occupation:</strong> <span className="border-b border-black inline-block min-w-[200px]">{patient.occupation}</span></p>
                        </div>
                    </div>

                    <div className="border border-black p-4 mb-4">
                        <p className="font-bold underline mb-2">Health Conditions</p>
                        <div className="grid grid-cols-3 gap-2 text-xs italic">
                            {JSON.parse(patient.conditions || '[]').map((c: string) => (
                                <span key={c}>[x] {c}</span>
                            ))}
                        </div>
                    </div>

                    <div className="border border-black p-4 mb-4">
                        <p className="font-bold underline mb-2">Dietary Restrictions</p>
                        <div className="grid grid-cols-3 gap-2 text-xs italic">
                            {JSON.parse(patient.diet || '[]').map((d: string) => (
                                <span key={d}>[x] {d}</span>
                            ))}
                        </div>
                    </div>

                    <div className="border border-black p-4 mb-6 min-h-[100px]">
                        <p className="font-bold underline mb-2">Patient History</p>
                        <p className="text-sm leading-relaxed">{patient.history}</p>
                    </div>

                    <div className="border border-black">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border border-black p-2 text-left">Date</th>
                                    <th className="border border-black p-2 text-left">Assessment</th>
                                    <th className="border border-black p-2 text-center">Pain</th>
                                    <th className="border border-black p-2 text-left">Mobility</th>
                                    <th className="border border-black p-2 text-left">Tech.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1,2,3,4,5].map(i => (
                                    <tr key={i} className="h-8">
                                        <td className="border border-black p-2"></td>
                                        <td className="border border-black p-2"></td>
                                        <td className="border border-black p-2"></td>
                                        <td className="border border-black p-2"></td>
                                        <td className="border border-black p-2"></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 text-center border-t border-dashed border-black pt-4">
                        <p className="text-xs font-bold uppercase">⚠️ Treatment is at patient's own risk. This is a computer generated record.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TreatmentCard;
