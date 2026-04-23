const API_BASE = 'http://localhost:5000/api';

// Safe JSON Parsing Utility to prevent crashes on malformed DB data
export const safeParse = (str: string, fallback: any = []) => {
    try {
        if (!str) return fallback;
        const parsed = JSON.parse(str);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch (e) {
        console.warn("JSON Parse Error, using fallback:", e);
        return fallback;
    }
};

export const getPatients = async (query?: string) => {
    const url = query ? `${API_BASE}/patients?query=${query}` : `${API_BASE}/patients`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch patients');
    return res.json();
};

export const createPatient = async (data: any) => {
    const res = await fetch(`${API_BASE}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create patient');
    return res.json();
};

export const updatePatient = async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update patient');
    return res.json();
};

export const getSessions = async (patientId: string) => {
    const res = await fetch(`${API_BASE}/sessions/${patientId}`);
    if (!res.ok) throw new Error('Failed to fetch sessions');
    return res.json();
};

export const logSession = async (data: any) => {
    const res = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to log session');
    return res.json();
};

export const getPayments = async () => {
    const res = await fetch(`${API_BASE}/payments`);
    if (!res.ok) throw new Error('Failed to fetch payments');
    return res.json();
};

export const recordPayment = async (data: any) => {
    const res = await fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to record payment');
    return res.json();
};

export const getRevenue = async () => {
    const res = await fetch(`${API_BASE}/revenue`);
    if (!res.ok) throw new Error('Failed to fetch revenue');
    return res.json();
};

export const getSettings = async () => {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
};

export const updateSettings = async (key: string, value: string) => {
    const res = await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
};
