import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Patients from '@/pages/Patients';
import PatientDetail from '@/pages/PatientDetail';
import Sessions from '@/pages/Sessions';
import RegularVisits from '@/pages/RegularVisits';
import Payments from '@/pages/Payments';
import Calendar from '@/pages/Calendar';
import AdminTelegram from '@/pages/admin/Telegram';
import AdminSecurity from '@/pages/admin/Security';
import AdminRoles from '@/pages/admin/Roles';
import AdminUsers from '@/pages/admin/Users';
import Login from '@/pages/Login';
import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { api } from '@/lib/api';
import { emitAppEvent, clearAllAppListeners, onAppEvent } from "@/lib/appEvents";

// ─── Auth Context ────────────────────────────────────────────────────────────

interface AuthUser {
  id: string;
  login_id: string;
  name: string;
  role: string;
}

interface Permissions {
  [screen: string]: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  permissions: Permissions;
  loading: boolean;
  reload: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  permissions: {},
  loading: true,
  reload: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// ─── Permission helper ────────────────────────────────────────────────────────

export function usePermission(screen: string): { level: string; canView: boolean; canEdit: boolean } {
  const { permissions } = useContext(AuthContext);
  const level = permissions[screen] || 'HIDDEN';
  return {
    level,
    canView: level === 'VIEW' || level === 'EDIT',
    canEdit: level === 'EDIT',
  };
}

// ─── Auto-login for development ─────────────────────────────────────────────

const AUTO_LOGIN_ENABLED = true; // Set to false to disable
const AUTO_LOGIN_CREDS = { loginId: 'admin', password: 'admin123' };

async function attemptAutoLogin(): Promise<boolean> {
  if (localStorage.getItem('snc_token')) return false;
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(AUTO_LOGIN_CREDS),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('snc_token', data.token);
    localStorage.setItem('snc_user', JSON.stringify(data.user));
    return true;
  } catch { return false; }
}

// ─── Auth Guard (validates token with backend, fetches user + permissions) ──

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ user: AuthUser | null; permissions: Permissions; loading: boolean }>({
    user: null,
    permissions: {},
    loading: true,
  });

  const reload = useCallback(() => {
    const token = localStorage.getItem('snc_token');
    if (!token) {
      setState({ user: null, permissions: {}, loading: false });
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    Promise.all([
      api<{ user: AuthUser }>('/api/auth/me'),
      api<{ permissions: Permissions }>('/api/auth/permissions'),
    ])
      .then(([meData, permData]) => {
        localStorage.setItem('snc_user', JSON.stringify(meData.user));
        setState({ user: meData.user, permissions: permData.permissions || {}, loading: false });
      })
      .catch(() => {
        localStorage.removeItem('snc_token');
        localStorage.removeItem('snc_user');
        setState({ user: null, permissions: {}, loading: false });
      });
  }, []);

  useEffect(() => {
    const cleanups = [
      onAppEvent('app:permissions-changed', reload),
    ];
    return () => cleanups.forEach(fn => fn());
  }, [reload]);

  useEffect(() => {
    const doReload = () => { /* nop — reload captured in closure */ };
    if (AUTO_LOGIN_ENABLED) {
      attemptAutoLogin().then(ok => ok && reload()).catch(() => reload());
    } else {
      reload();
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  if (state.loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-[#f0f7f4]'>
        <div className='text-[#1a7a4a] font-semibold'>Loading...</div>
      </div>
    );
  }

  if (!state.user) {
    window.location.href = '/login';
    return null;
  }

  return (
    <AuthContext.Provider value={{ user: state.user, permissions: state.permissions, loading: false, reload }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route
            path='/'
            element={
              <AuthGuard>
                <Layout />
              </AuthGuard>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path='patients' element={<Patients />} />
            <Route path='patients/:id' element={<PatientDetail />} />
            <Route path='sessions' element={<Sessions />} />
            <Route path='regular-visits' element={<RegularVisits />} />
            <Route path='payments' element={<Payments />} />
            <Route path='calendar' element={<Calendar />} />
            <Route path='admin/telegram' element={<AdminTelegram />} />
            <Route path='admin/security' element={<AdminSecurity />} />
            <Route path='admin/roles' element={<AdminRoles />} />
            <Route path='admin/users' element={<AdminUsers />} />
          </Route>
          <Route path='*' element={<Navigate to='/' />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}