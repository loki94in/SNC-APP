import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import PatientList from './components/PatientList';
import AddPatient from './components/AddPatient';
import SessionList from './components/SessionList';
import PaymentList from './components/PaymentList';

const App: React.FC = () => {
    const [screen, setScreen] = useState('dashboard');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-primary-dark flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                    <div className="text-5xl mb-4">🏥</div>
                    <h2 className="text-2xl font-bold text-primary-dark mb-2">Siyaram Neurotherapy</h2>
                    <p className="text-slate-500 mb-8">Admin Portal Login</p>
                    <form onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); }}>
                        <div className="text-left mb-4">
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Username</label>
                            <input type="text" defaultValue="admin" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-light outline-none" />
                        </div>
                        <div className="text-left mb-8">
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Password</label>
                            <input type="password" defaultValue="admin123" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-light outline-none" />
                        </div>
                        <button type="submit" className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-dark transition-colors">
                            Login
                        </button>
                    </form>
                    <p className="mt-6 text-xs text-slate-400">Default: admin / admin123</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 bg-primary-dark text-white flex flex-col fixed inset-y-0">
                <div className="p-8 border-b border-white/10 text-center">
                    <h1 className="text-xl font-bold tracking-tight">SNC REGISTER</h1>
                </div>
                <nav className="flex-grow py-6">
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
                {screen === 'patients' && <PatientList />}
                {screen === 'add-patient' && <AddPatient onComplete={() => setScreen('patients')} />}
                {screen === 'sessions' && <SessionList />}
                {screen === 'payments' && <PaymentList />}
            </main>
        </div>
    );
};

export default App;
