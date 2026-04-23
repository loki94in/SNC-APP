import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../api';

const Settings: React.FC = () => {
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        getSettings().then(s => setPassword(s.admin_password || ''));
    }, []);

    const handleSave = async () => {
        try {
            await updateSettings('admin_password', password);
            setMessage('Settings saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            alert('Failed to save settings');
        }
    };

    return (
        <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-8">System Settings</h2>
            <div className="bg-white rounded-xl shadow-sm border p-8">
                <div className="mb-8 pb-6 border-b">
                    <h3 className="font-semibold mb-4 text-slate-700">Security</h3>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Admin Password</label>
                        <input 
                            type="password" 
                            className="p-3 border rounded-lg focus:ring-2 focus:ring-primary-light outline-none max-w-md"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <p className="text-xs text-slate-400 mt-1">This password is required for admin portal login.</p>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="font-semibold mb-4 text-slate-700">Data Management</h3>
                    <div className="flex gap-4">
                        <button className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-dark transition-colors">
                            Backup to ZIP
                        </button>
                        <button className="border px-6 py-2 rounded-lg font-semibold hover:bg-slate-50 transition-colors">
                            Restore Data
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Recommended: Backup your data at least once a week.</p>
                </div>

                <div className="pt-6 border-t flex items-center justify-between">
                    <button 
                        onClick={handleSave}
                        className="bg-primary text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-dark transition-colors"
                    >
                        Save All Settings
                    </button>
                    {message && <span className="text-primary font-semibold animate-pulse">{message}</span>}
                </div>
            </div>
        </div>
    );
};

export default Settings;
