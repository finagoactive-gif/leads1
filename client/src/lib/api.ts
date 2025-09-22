import { apiRequest } from "./queryClient";

const API_BASE = "/api";

export const api = {
  auth: {
    login: (data: { email: string; password: string }) =>
      apiRequest("POST", `${API_BASE}/auth/login`, data),
    register: (data: { name: string; email: string; password: string }) =>
      apiRequest("POST", `${API_BASE}/auth/register`, data),
    me: () => apiRequest("GET", `${API_BASE}/auth/me`),
  },
  leads: {
    submit: (data: any) => apiRequest("POST", `${API_BASE}/leads/submit`, data),
    getMy: () => apiRequest("GET", `${API_BASE}/leads/my`),
    getAll: () => apiRequest("GET", `${API_BASE}/leads/all`),
    getById: (id: string) => apiRequest("GET", `${API_BASE}/leads/${id}`),
  },
  admin: {
    getPendingLeads: () => apiRequest("GET", `${API_BASE}/admin/pending-leads`),
    approveLead: (id: string) => apiRequest("PATCH", `${API_BASE}/admin/leads/${id}/approve`),
    rejectLead: (id: string) => apiRequest("PATCH", `${API_BASE}/admin/leads/${id}/reject`),
  },
  superadmin: {
    getUsers: () => apiRequest("GET", `${API_BASE}/superadmin/users`),
    createAdmin: (data: { name: string; email: string; password: string }) =>
      apiRequest("POST", `${API_BASE}/superadmin/create-admin`, data),
    updateUserCredits: (userId: string, data: { action: string; amount: number }) =>
      apiRequest("PATCH", `${API_BASE}/superadmin/users/${userId}/credits`, data),
    getCreditTransactions: () => apiRequest("GET", `${API_BASE}/superadmin/credit-transactions`),
  },
};

// Helper to set auth token
export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
};

// Helper to get auth token
export const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};
