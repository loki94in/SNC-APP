const API_BASE = (import.meta as any).env?.VITE_API_BASE || "/api";

export interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

export async function api<T = any>(path: string, opts: ApiOptions = {}): Promise<T> {
  const token = localStorage.getItem("snc_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...opts.headers,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body != null ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("snc_token");
    localStorage.removeItem("snc_user");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export function getUser() {
  try {
    const raw = localStorage.getItem("snc_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem("snc_token");
}

export function clearAuth() {
  localStorage.removeItem("snc_token");
  localStorage.removeItem("snc_user");
}