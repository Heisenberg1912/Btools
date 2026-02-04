// API Client for Btools Backend

// In production (Vercel), use relative URL since API is on same domain
// In development, use localhost:3001
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Token management
let accessToken: string | null = localStorage.getItem('access_token');
let refreshToken: string | null = localStorage.getItem('refresh_token');

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const getAccessToken = () => accessToken;

// Base fetch with auth
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 - try refresh token
    if (response.status === 401 && refreshToken) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
        if (retryResponse.ok) {
          const data = await retryResponse.json();
          return { data, error: null };
        }
      }
      clearTokens();
      return { data: null, error: 'Session expired. Please login again.' };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { data: null, error: errorData.detail || `Error: ${response.status}` };
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return { data: null, error: null };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Network error' };
  }
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      setTokens(data.access_token, data.refresh_token);
      return true;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }
  return false;
}

// Auth API
export const authApi = {
  register: async (email: string, password: string, name: string) => {
    return fetchWithAuth<{ id: number; email: string; name: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { data: null, error: error.detail || 'Login failed' };
    }

    const data = await response.json();
    setTokens(data.access_token, data.refresh_token);
    return { data, error: null };
  },

  logout: async () => {
    await fetchWithAuth('/auth/logout', { method: 'POST' });
    clearTokens();
  },

  getMe: async () => {
    return fetchWithAuth<{
      id: number;
      email: string;
      name: string;
      role: string;
      is_active: boolean;
    }>('/auth/me');
  },
};

// Users API
export const usersApi = {
  getProfile: () => fetchWithAuth<any>('/users/me'),
  updateProfile: (data: { name?: string; phone?: string }) =>
    fetchWithAuth<any>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getSubscription: () => fetchWithAuth<any>('/users/me/subscription'),
  getUsage: () => fetchWithAuth<any>('/users/me/usage'),
};

// Projects API
export const projectsApi = {
  list: (page = 1, perPage = 10) =>
    fetchWithAuth<any>(`/projects?page=${page}&per_page=${perPage}`),

  get: (id: number) => fetchWithAuth<any>(`/projects/${id}`),

  getData: (id: number) => fetchWithAuth<any>(`/projects/${id}/data`),

  create: (data: { name: string; description?: string; location?: string; mode?: string }) =>
    fetchWithAuth<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    fetchWithAuth<any>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchWithAuth<any>(`/projects/${id}`, { method: 'DELETE' }),

  analyze: (id: number, imageBase64: string, mode = 'under-construction') =>
    fetchWithAuth<any>(`/projects/${id}/analyze`, {
      method: 'POST',
      body: JSON.stringify({ image_base64: imageBase64, mode }),
    }),

  uploadAndAnalyze: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}/analyze/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { data: null, error: error.detail || 'Upload failed' };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Upload error' };
    }
  },

  getAnalyses: (id: number, limit = 10) =>
    fetchWithAuth<any>(`/projects/${id}/analyses?limit=${limit}`),
};

// Financial API
export const financialApi = {
  getBudget: (projectId: number) =>
    fetchWithAuth<any>(`/projects/${projectId}/financial/budget`),

  createBudget: (projectId: number, data: any) =>
    fetchWithAuth<any>(`/projects/${projectId}/financial/budget`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getValuations: (projectId: number) =>
    fetchWithAuth<any>(`/projects/${projectId}/financial/valuations`),

  getTransactions: (projectId: number) =>
    fetchWithAuth<any>(`/projects/${projectId}/financial/transactions`),

  getSummary: (projectId: number) =>
    fetchWithAuth<any>(`/projects/${projectId}/financial/summary`),
};

// Construction API
export const constructionApi = {
  getManpower: (projectId: number) =>
    fetchWithAuth<any>(`/projects/${projectId}/construction/manpower/latest`),

  getMachinery: (projectId: number) =>
    fetchWithAuth<any>(`/projects/${projectId}/construction/machinery/latest`),

  getMaterials: (projectId: number) =>
    fetchWithAuth<any>(`/projects/${projectId}/construction/materials`),

  getTasks: (projectId: number) =>
    fetchWithAuth<any>(`/projects/${projectId}/construction/tasks`),

  createTask: (projectId: number, data: any) =>
    fetchWithAuth<any>(`/projects/${projectId}/construction/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTask: (projectId: number, taskId: number, data: any) =>
    fetchWithAuth<any>(`/projects/${projectId}/construction/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getGantt: (projectId: number) =>
    fetchWithAuth<any>(`/projects/${projectId}/construction/gantt`),
};

// Reports API
export const reportsApi = {
  getAvailable: (projectId: number) =>
    fetchWithAuth<any>(`/projects/${projectId}/reports/available`),

  list: (projectId: number) =>
    fetchWithAuth<any>(`/projects/${projectId}/reports`),

  generate: (projectId: number, reportType: string, format = 'pdf') =>
    fetchWithAuth<any>(`/projects/${projectId}/reports`, {
      method: 'POST',
      body: JSON.stringify({ report_type: reportType, report_format: format }),
    }),

  download: (projectId: number, reportId: number) =>
    `${API_BASE_URL}/projects/${projectId}/reports/${reportId}/download`,
};

// Notifications API
export const notificationsApi = {
  list: (unreadOnly = false) =>
    fetchWithAuth<any>(`/notifications?unread_only=${unreadOnly}`),

  getUnreadCount: () => fetchWithAuth<any>('/notifications/unread-count'),

  markAsRead: (ids: number[]) =>
    fetchWithAuth<any>('/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ notification_ids: ids }),
    }),

  markAllRead: () =>
    fetchWithAuth<any>('/notifications/mark-all-read', { method: 'POST' }),

  getPreferences: () => fetchWithAuth<any>('/notifications/preferences'),

  updatePreferences: (data: any) =>
    fetchWithAuth<any>('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Subscriptions API
export const subscriptionsApi = {
  getPlans: () => fetchWithAuth<any>('/subscriptions/plans'),

  getCurrent: () => fetchWithAuth<any>('/subscriptions/current'),

  getUsage: () => fetchWithAuth<any>('/subscriptions/usage'),

  checkout: (plan: string) =>
    fetchWithAuth<any>('/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }),

  cancel: () =>
    fetchWithAuth<any>('/subscriptions/cancel', { method: 'POST' }),
};

// Chatbot API
export const chatbotApi = {
  chat: (message: string, projectId?: number) =>
    fetchWithAuth<any>('/chatbot/chat', {
      method: 'POST',
      body: JSON.stringify({ message, project_id: projectId }),
    }),

  getSuggestions: (projectId?: number) =>
    fetchWithAuth<any>(`/chatbot/suggestions${projectId ? `?project_id=${projectId}` : ''}`),

  clearHistory: () =>
    fetchWithAuth<any>('/chatbot/clear-history', { method: 'POST' }),
};

// Compliance API
export const complianceApi = {
  getLatest: (projectId: number) =>
    fetchWithAuth<any>(`/projects/${projectId}/compliance/checks/latest`),

  getGeoData: (projectId: number) =>
    fetchWithAuth<any>(`/projects/${projectId}/compliance/geo`),

  getOverview: (projectId: number) =>
    fetchWithAuth<any>(`/projects/${projectId}/compliance/overview`),

  getCostSavings: (projectId: number) =>
    fetchWithAuth<any>(`/projects/${projectId}/compliance/cost-savings`),
};

export default {
  auth: authApi,
  users: usersApi,
  projects: projectsApi,
  financial: financialApi,
  construction: constructionApi,
  reports: reportsApi,
  notifications: notificationsApi,
  subscriptions: subscriptionsApi,
  chatbot: chatbotApi,
  compliance: complianceApi,
};
