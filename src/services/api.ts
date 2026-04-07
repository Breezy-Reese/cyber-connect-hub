import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Types
export interface User {
  _id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'client' | 'admin';
  balance: number;
  created_at: string;
  last_login?: string;
}

export interface Computer {
  _id: string;
  computer_name: string;
  ip_address?: string;
  status: 'available' | 'in_use' | 'maintenance' | 'offline';
  hourly_rate: number;
  current_session?: string;
  specifications?: {
    processor?: string;
    ram?: string;
    storage?: string;
    os?: string;
  };
}

export interface Session {
  _id: string;
  user: User;
  computer: Computer;
  start_time: string;
  end_time?: string;
  remaining_time: number;
  total_cost: number;
  status: 'active' | 'ended' | 'expired' | 'paused';
  hourly_rate_at_start: number;
  remaining_minutes: number;
  elapsed_minutes: number;
}

export interface Request {
  _id: string;
  user: string | User;
  session?: string | Session;
  type: 'print' | 'time_extension' | 'assistance' | 'service' | 'food' | 'drink';
  details: any;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  admin_response?: string;
  created_at: string;
  resolved_at?: string;
}

export interface Message {
  _id: string;
  sender: string | User;
  receiver: string | User;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export interface LoginCredentials {
  username?: string;
  password?: string;
  loginType: 'password' | 'ticket';
  ticketCode?: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email: string;
  full_name: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: LoginCredentials): Promise<AxiosResponse<{ token: string; user: User }>> => 
    api.post('/auth/login', credentials),
  register: (userData: RegisterData): Promise<AxiosResponse<{ message: string; user: User }>> => 
    api.post('/auth/register', userData),
  getMe: (): Promise<AxiosResponse<{ user: User }>> => 
    api.get('/auth/me'),
  logout: (): Promise<AxiosResponse<{ message: string }>> => 
    api.post('/auth/logout'),
};

// Session API
export const sessionAPI = {
  start: (data: { computerId: string; duration?: number }): Promise<AxiosResponse<{ success: boolean; data: Session }>> => 
    api.post('/sessions/start', data),
  end: (): Promise<AxiosResponse<{ success: boolean; data: Session }>> => 
    api.post('/sessions/end'),
  getCurrent: (): Promise<AxiosResponse<{ success: boolean; data: Session }>> => 
    api.get('/sessions/current'),
  getHistory: (): Promise<AxiosResponse<{ success: boolean; data: Session[] }>> => 
    api.get('/sessions/history'),
};

// Computer API
export const computerAPI = {
  getAll: (): Promise<AxiosResponse<{ success: boolean; data: Computer[] }>> => 
    api.get('/computers'),
  getAvailable: (): Promise<AxiosResponse<{ success: boolean; data: Computer[] }>> => 
    api.get('/computers/available'),
  getById: (id: string): Promise<AxiosResponse<{ success: boolean; data: Computer }>> => 
    api.get(`/computers/${id}`),
};

// Request API
export const requestAPI = {
  create: (data: { type: string; details: any; sessionId?: string }): Promise<AxiosResponse<{ success: boolean; data: Request }>> => 
    api.post('/requests', data),
  getMyRequests: (): Promise<AxiosResponse<{ success: boolean; data: Request[] }>> => 
    api.get('/requests'),
  getPending: (): Promise<AxiosResponse<{ success: boolean; data: Request[] }>> => 
    api.get('/admin/pending-requests'),
  approve: (id: string, response?: string): Promise<AxiosResponse<{ success: boolean; data: Request }>> => 
    api.put(`/admin/requests/${id}/approve`, { response }),
  reject: (id: string, response?: string): Promise<AxiosResponse<{ success: boolean; data: Request }>> => 
    api.put(`/admin/requests/${id}/reject`, { response }),
};

// Admin API
export const adminAPI = {
  getDashboard: (): Promise<AxiosResponse<{ success: boolean; data: any }>> => 
    api.get('/admin/dashboard'),
  getAllUsers: (): Promise<AxiosResponse<{ success: boolean; data: User[] }>> => 
    api.get('/admin/users'),
  getActiveSessions: (): Promise<AxiosResponse<{ success: boolean; data: Session[] }>> => 
    api.get('/admin/active-sessions'),
  updateUserBalance: (userId: string, data: { amount: number; action: 'add' | 'subtract' }): Promise<AxiosResponse<{ success: boolean; data: User }>> => 
    api.put(`/admin/users/${userId}/balance`, data),
  getLogs: (): Promise<AxiosResponse<{ success: boolean; data: any[] }>> => 
    api.get('/admin/logs'),
  generateTicket: (duration: number): Promise<AxiosResponse<{ success: boolean; data: { code: string; duration: number; expires_at: string } }>> => 
    api.post('/admin/tickets', { duration }),
};

export default api;