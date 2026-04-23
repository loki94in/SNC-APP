import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import PatientList from './components/PatientList';
import PatientForm from './components/PatientForm';
import SessionList from './components/SessionList';
import PaymentList from './components/PaymentList';
import Settings from './components/Settings';
import PatientDetail from './components/PatientDetail';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
    const [screen, setScreen] = useState('dashboard');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [editPatient, setEditPatient] = useState<any | null>(null);
    const [activePatient, setActivePatient] = useState<any | null>(null);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === 'admin' && password === 'admin123') {
            setIsLoggedIn(true);
        } else {
            alert('Invalid credentials');
        }
    };

    const handleEditPatient = (patient: any) => {
        setEditPatient(patient);
        setScreen('add-patient');
    };

    const handleViewPatient = (patient: any) => {
        setActivePatient(patient);
        setScreen('patient-detail');
    };

    if (!isLoggedIn) {
        return (
            <ErrorBoundary>
                <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                    <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">S</div>
                            <h1 className="text-2xl font-bold text-slate-800">SNC Clinical Portal</h1>
                            <p className="text-slate-500 text-sm mt-1">Please sign in to continue</p>
                        </div>
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</label>
                                <input 
                                    type="text" required 
                                    className="w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-primary-light outline-none transition-all"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
                                <input 
                                    type="password" required 
                                    className="w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-primary-light outline-none transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="w-full bg-primary text-white p-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all transform active:scale-95">
                                Access System
                            </button>
                        </form>
                    </div>
                </div>
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-slate-50 flex">
                {/* Sidebar */}
                <aside className="w-64 bg-primary-dark text-white fixed h-full flex flex-col shadow-2xl z-20">
                    <div className="p-8 border-b border-white/10">
                        <h1 className="text-xl font-bold tracking-tight">SNC REGISTER</h1>
                    </div>
                    <nav className="flex-grow py-6 space-y-1">
                        <button 
                            onClick={() => setScreen('dashboard')}
                            className={`w-full flex items-center gap-3 px-8 py-3 transition-colors ${screen === 'dashboard' ? 'bg-white/10 border-r-4 border-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                        >
                            <span>📊</span> Dashboard
                        </button>
                        <button 
                            onClick={() => setScreen('patients')}
                            className={`w-full flex items-center gap-3 px-8 py-3 transition-colors ${screen === 'patients' ? 'bg-white/10 border-r-4 border-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                        >
                            <span>👥</span> Patients
                        </button>
                        <button 
                            onClick={() => setScreen('sessions')}
                            className={`w-full flex items-center gap-3 px-8 py-3 transition-colors ${screen === 'sessions' ? 'bg-white/10 border-r-4 border-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                        >
                            <span>📅</span> Sessions
                        </button>
                        <button 
                            onClick={() => setScreen('payments')}
                            className={`w-full flex items-center gap-3 px-8 py-3 transition-colors ${screen === 'payments' ? 'bg-white/10 border-r-4 border-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                        >
                            <span>💰</span> Payments
                        </button>
                        <button 
                            onClick={() => setScreen('settings')}
                            className={`w-full flex items-center gap-3 px-8 py-3 transition-colors ${screen === 'settings' ? 'bg-white/10 border-r-4 border-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                        >
                            <span>⚙️</span> Settings
                        </button>
                    </nav>
                    <div className="p-6 border-t border-white/10">
                        <button onClick={() => setIsLoggedIn(false)} className="w-full flex items-center gap-3 px-2 py-2 text-white/70 hover:text-white">
                            <span>🚪</span> Logout
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="ml-64 flex-grow p-10 max-w-7xl">
                    {screen === 'dashboard' && <Dashboard onNavigate={setScreen} />}
                    {screen === 'patients' && <PatientList onEdit={handleEditPatient} onView={handleViewPatient} />}
                    {screen === 'add-patient' && (
                        <PatientForm 
                            editData={editPatient}
                            onComplete={() => {
                                setEditPatient(null);
                                setScreen('patients');
                            }} 
                        />
                    )}
                    {screen === 'sessions' && <SessionList />}
                    {screen === 'payments' && <PaymentList />}
                    {screen === 'settings' && <Settings />}
                    {screen === 'patient-detail' && activePatient && (
                        <PatientDetail 
                            patient={activePatient} 
                            onBack={() => setScreen('patients')} 
                        />
                    )}
                </main>
            </div>
        </ErrorBoundary>
    );
};

export default App;
