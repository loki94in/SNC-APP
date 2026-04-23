const API_BASE_URL = 'http://localhost:5000/api';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options,
    });
    if (!response.ok) throw new Error('API Error');
    return response.json();
};

export const getPatients = (query?: string) => apiFetch(`/patients${query ? `?query=${query}` : ''}`);
export const createPatient = (data: any) => apiFetch('/patients', { method: 'POST', body: JSON.stringify(data) });
export const getAllSessions = () => apiFetch('/sessions');
export const getSessions = (patientId: string) => apiFetch(`/sessions/${patientId}`);
export const logSession = (data: any) => apiFetch('/sessions', { method: 'POST', body: JSON.stringify(data) });
export const getPayments = () => apiFetch('/payments');
export const getRevenue = () => apiFetch('/revenue');
export const recordPayment = (data: any) => apiFetch('/payments', { method: 'POST', body: JSON.stringify(data) });
