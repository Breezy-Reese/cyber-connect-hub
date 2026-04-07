// src/lib/api.ts
// Centralised API client — import this everywhere instead of raw fetch

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ── helpers ─────────────────────────────────────────────────────────── */

const getToken = () => localStorage.getItem("token");

const headers = (extra: Record<string, string> = {}) => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: headers(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data as T;
}

const get  = <T>(path: string)              => request<T>("GET",    path);
const post = <T>(path: string, body: unknown) => request<T>("POST",   path, body);
const patch= <T>(path: string, body: unknown) => request<T>("PATCH",  path, body);
const del  = <T>(path: string)              => request<T>("DELETE", path);

/* ── types ───────────────────────────────────────────────────────────── */

export interface AuthUser {
  id: string;
  username: string;
  role: "client" | "admin";
}

export interface SessionData {
  _id: string;
  pcId: string;
  durationMinutes: number;
  remainingSeconds: number;
  status: "active" | "paused" | "ended" | "locked";
  ratePerHour: number;
  user: string | { username: string };
  startTime: string;
}

export interface RequestData {
  _id: string;
  type: string;
  status: "pending" | "approved" | "rejected";
  pcId: string;
  user: string | { username: string };
  createdAt: string;
}

export interface MessageData {
  _id: string;
  text: string;
  fromRole: "client" | "admin";
  from: string | { username: string };
  createdAt: string;
}

export interface TicketData {
  _id: string;
  code: string;
  durationMinutes: number;
  priceKES: number;
  isUsed: boolean;
}

/* ── auth ────────────────────────────────────────────────────────────── */

export const authApi = {
  register: (username: string, password: string, adminSecret?: string) =>
    post<{ token: string; user: AuthUser }>("/auth/register", { username, password, adminSecret }),

  login: (username: string, password: string) =>
    post<{ token: string; user: AuthUser }>("/auth/login", { username, password }),

  ticketLogin: (ticketCode: string, pcId: string) =>
    post<{ token: string; user: AuthUser; session: SessionData }>("/auth/ticket-login", { ticketCode, pcId }),

  me: () => get<{ user: AuthUser }>("/auth/me"),
};

/* ── sessions ────────────────────────────────────────────────────────── */

export const sessionApi = {
  start: (pcId: string, durationMinutes: number) =>
    post<{ session: SessionData }>("/sessions/start", { pcId, durationMinutes }),

  getMy: () => get<{ session: SessionData }>("/sessions/my"),

  end: (id: string) => post<{ session: SessionData }>(`/sessions/${id}/end`, {}),

  // Admin
  getAll: () => get<{ sessions: SessionData[] }>("/sessions"),

  adjustTime: (id: string, minutes: number) =>
    patch<{ session: SessionData }>(`/sessions/${id}/time`, { minutes }),

  lock: (id: string) => patch<{ session: SessionData }>(`/sessions/${id}/lock`, {}),
};

/* ── service requests ────────────────────────────────────────────────── */

export const requestApi = {
  create: (type: string, extraMinutes?: number, note?: string) =>
    post<{ request: RequestData }>("/requests", { type, extraMinutes, note }),

  getPending: () => get<{ requests: RequestData[] }>("/requests"),

  resolve: (id: string, status: "approved" | "rejected", note?: string) =>
    patch<{ request: RequestData }>(`/requests/${id}`, { status, note }),
};

/* ── messages ────────────────────────────────────────────────────────── */

export const messageApi = {
  send: (text: string, sessionId?: string) =>
    post<{ message: MessageData }>("/messages", { text, sessionId }),

  getHistory: (sessionId: string) =>
    get<{ messages: MessageData[] }>(`/messages/${sessionId}`),
};

/* ── tickets (admin) ─────────────────────────────────────────────────── */

export const ticketApi = {
  create: (durationMinutes: number, priceKES: number, quantity = 1) =>
    post<{ tickets: TicketData[] }>("/tickets", { durationMinutes, priceKES, quantity }),

  getAll: (used?: boolean) =>
    get<{ tickets: TicketData[] }>(`/tickets${used !== undefined ? `?used=${used}` : ""}`),

  delete: (id: string) => del<{ message: string }>(`/tickets/${id}`),
};

/* ── admin stats ─────────────────────────────────────────────────────── */

export const adminApi = {
  getStats: () =>
    get<{ activeSessions: number; pendingRequests: number; totalClients: number; earningsKES: number }>(
      "/admin/stats"
    ),
};

/* ── token helpers ───────────────────────────────────────────────────── */

export const saveToken  = (token: string) => localStorage.setItem("token", token);
export const clearToken = ()               => localStorage.removeItem("token");