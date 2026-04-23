import React, { useState } from 'react';
import { createPatient } from '../api';

const AddPatient: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        age: '',
        gender: 'Male',
        address: '',
        occupation: '',
        conditions: '',
        diet: '',
        history: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createPatient({
                ...formData,
                conditions: formData.conditions.split(',').map(s => s.trim()),
                diet: formData.diet.split(',').map(s => s.trim())
            });
            onComplete();
        } catch (err) {
            alert('Failed to save patient');
        }
    };

    return (
        <div className="max-w-4xl">
            <h2 className="text-2xl font-bold mb-8">Register New Patient</h2>
            <div className="bg-white rounded-xl shadow-sm border p-8">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Full Name</label>
                            <input 
                                type="text" required 
                                className="p-3 border rounded-lg focus:ring-2 focus:ring-primary-light outline-none"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Phone Number</label>
                            <input 
                                type="tel" required 
                                className="p-3 border rounded-lg focus:ring-2 focus:ring-primary-light outline-none"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Age</label>
                            <input 
                                type="number" 
                                className="p-3 border rounded-lg focus:ring-2 focus:ring-primary-light outline-none"
                                value={formData.age}
                                onChange={(e) => setFormData({...formData, age: e.target.value})}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Gender</label>
                            <select 
                                className="p-3 border rounded-lg focus:ring-2 focus:ring-primary-light outline-none"
                                value={formData.gender}
                                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                            >
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 flex flex-col gap-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Address</label>
                            <textarea 
                                rows={2} 
                                className="p-3 border rounded-lg focus:ring-2 focus:ring-primary-light outline-none"
                                value={formData.address}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                            ></textarea>
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold mt-10 mb-4 border-b pb-2">Medical Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 flex flex-col gap-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Health Conditions (comma separated)</label>
                            <input 
                                type="text" placeholder="e.g. Paralysis, BP, Slip Disc"
                                className="p-3 border rounded-lg focus:ring-2 focus:ring-primary-light outline-none"
                                value={formData.conditions}
                                onChange={(e) => setFormData({...formData, conditions: e.target.value})}
                            />
                        </div>
                        <div className="md:col-span-2 flex flex-col gap-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Patient History</label>
                            <textarea 
                                rows={3} 
                                className="p-3 border rounded-lg focus:ring-2 focus:ring-primary-light outline-none"
                                value={formData.history}
                                onChange={(e) => setFormData({...formData, history: e.target.value})}
                            ></textarea>
                        </div>
                    </div>

                    <div className="mt-10 flex gap-4 justify-end">
                        <button 
                            type="button" 
                            onClick={onComplete}
                            className="px-6 py-3 border rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors"
                        >
                            Save Patient Record
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPatient;
