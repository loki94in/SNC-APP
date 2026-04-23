import React, { useState, useEffect } from 'react';
import { createPatient, updatePatient } from '../api';

interface PatientFormProps {
    onComplete: () => void;
    editData?: any;
}

const PatientForm: React.FC<PatientFormProps> = ({ onComplete, editData }) => {
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

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editData) {
            setFormData({
                ...editData,
                conditions: Array.isArray(JSON.parse(editData.conditions || '[]')) ? JSON.parse(editData.conditions).join(', ') : editData.conditions,
                diet: Array.isArray(JSON.parse(editData.diet || '[]')) ? JSON.parse(editData.diet).join(', ') : editData.diet,
            });
        }
    }, [editData]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (formData.name.trim().length < 3) newErrors.name = 'Name must be at least 3 characters';
        if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Phone must be exactly 10 digits';
        if (Number(formData.age) < 1 || Number(formData.age) > 120) newErrors.age = 'Enter a valid age (1-120)';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        const payload = {
            ...formData,
            conditions: formData.conditions.split(',').map(s => s.trim()).filter(Boolean),
            diet: formData.diet.split(',').map(s => s.trim()).filter(Boolean)
        };

        try {
            if (editData) {
                await updatePatient(editData.id, payload);
            } else {
                await createPatient(payload);
            }
            onComplete();
        } catch (err) {
            setErrors({ submit: 'Failed to save patient. Please check your connection.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl">
            <h2 className="text-2xl font-bold mb-8">{editData ? 'Edit Patient Record' : 'Register New Patient'}</h2>
            <div className="bg-white rounded-xl shadow-sm border p-8">
                <form onSubmit={handleSubmit}>
                    {errors.submit && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm font-semibold">{errors.submit}</div>}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Full Name</label>
                            <input 
                                type="text" 
                                className={`p-3 border rounded-lg focus:ring-2 focus:ring-primary-light outline-none ${errors.name ? 'border-red-500' : ''}`}
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                            {errors.name && <span className="text-[10px] text-red-500 font-bold uppercase">{errors.name}</span>}
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Phone Number</label>
                            <input 
                                type="tel" 
                                className={`p-3 border rounded-lg focus:ring-2 focus:ring-primary-light outline-none ${errors.phone ? 'border-red-500' : ''}`}
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                            {errors.phone && <span className="text-[10px] text-red-500 font-bold uppercase">{errors.phone}</span>}
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Age</label>
                            <input 
                                type="number" 
                                className={`p-3 border rounded-lg focus:ring-2 focus:ring-primary-light outline-none ${errors.age ? 'border-red-500' : ''}`}
                                value={formData.age}
                                onChange={(e) => setFormData({...formData, age: e.target.value})}
                            />
                            {errors.age && <span className="text-[10px] text-red-500 font-bold uppercase">{errors.age}</span>}
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
                            disabled={isSubmitting}
                            onClick={onComplete}
                            className="px-6 py-3 border rounded-lg font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors disabled:bg-slate-400"
                        >
                            {isSubmitting ? 'Saving...' : (editData ? 'Update Record' : 'Save Patient Record')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PatientForm;
