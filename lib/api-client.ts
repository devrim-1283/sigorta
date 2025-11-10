// API Configuration
// Production: NEXT_PUBLIC_API_URL environment variable'dan gelir
// Development fallback: localhost:8000
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// API Helper Functions
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'omit',
    };

    try {
      const response = await fetch(url, {
        ...config,
        mode: 'cors', // Ensure CORS mode is set
        redirect: 'manual', // Don't follow redirects to avoid CORS issues
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.message || error.error || errorMessage;
          } else {
            const textError = await response.text();
            errorMessage = textError || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'omit',
      mode: 'cors', // Ensure CORS mode is set
      redirect: 'manual', // Don't follow redirects to avoid CORS issues
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    return await response.json();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Auth API
export const authApi = {
  login: async (credentials: { email?: string; phone?: string; tc_no?: string; password: string }) => {
    return apiClient.post<{ user: any; token: string }>('/auth/login', credentials);
  },
  logout: async () => {
    return apiClient.post('/auth/logout');
  },
  me: async () => {
    return apiClient.get<{ user: any }>('/auth/me');
  },
};

// Customer API
export const customerApi = {
  getAll: (params?: { search?: string; status?: string; per_page?: number }) => {
    if (!params) return apiClient.get('/customers');

    // Filter out undefined values
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );

    const queryParams = new URLSearchParams(filteredParams).toString();
    return apiClient.get(`/customers${queryParams ? '?' + queryParams : ''}`);
  },
  getById: (id: string) => {
    return apiClient.get(`/customers/${id}`);
  },
  create: (data: any) => {
    return apiClient.post('/customers', data);
  },
  update: (id: string, data: any) => {
    return apiClient.put(`/customers/${id}`, data);
  },
  delete: (id: string) => {
    return apiClient.delete(`/customers/${id}`);
  },
  closeFile: (id: string, reason?: string) => {
    return apiClient.post(`/customers/${id}/close`, { reason });
  },
  addNote: (id: string, content: string) => {
    return apiClient.post(`/customers/${id}/notes`, { içerik: content });
  },
};

// Document API
export const documentApi = {
  getAll: (params?: { search?: string; type?: string; status?: string }) => {
    if (!params) return apiClient.get('/documents');

    // Filter out undefined values
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );

    const queryParams = new URLSearchParams(filteredParams).toString();
    return apiClient.get(`/documents${queryParams ? '?' + queryParams : ''}`);
  },
  getById: (id: string) => {
    return apiClient.get(`/documents/${id}`);
  },
  upload: (formData: FormData) => {
    return apiClient.upload('/documents/upload', formData);
  },
  delete: (id: string) => {
    return apiClient.delete(`/documents/${id}`);
  },
  download: async (id: string) => {
    const url = `${API_BASE_URL}/documents/${id}/download`;
    const headers: HeadersInit = {};

    if (apiClient['token']) {
      headers['Authorization'] = `Bearer ${apiClient['token']}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'omit',
      mode: 'cors', // Ensure CORS mode is set
      redirect: 'manual', // Don't follow redirects to avoid CORS issues
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    // Get filename from Content-Disposition header if available
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `document-${id}`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Create blob and download
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};

// Payment API
export const paymentApi = {
  getAll: () => {
    return apiClient.get('/payments');
  },
  getById: (id: string) => {
    return apiClient.get(`/payments/${id}`);
  },
  create: (data: any) => {
    return apiClient.post('/payments', data);
  },
  update: (id: string, data: any) => {
    return apiClient.put(`/payments/${id}`, data);
  },
  delete: (id: string) => {
    return apiClient.delete(`/payments/${id}`);
  },
};

// Notification API
export const notificationApi = {
  getAll: () => {
    return apiClient.get('/notifications');
  },
  markAsRead: (id: string) => {
    return apiClient.put(`/notifications/${id}/read`);
  },
  markAllAsRead: () => {
    return apiClient.put('/notifications/read-all');
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: () => {
    return apiClient.get('/dashboard/stats');
  },
};

// File Type API
export const fileTypeApi = {
  getAll: () => {
    return apiClient.get('/file-types');
  },
};

// Dealer API
export const dealerApi = {
  getAll: (params?: { search?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    return apiClient.get(`/dealers${queryString ? '?' + queryString : ''}`);
  },
  getById: (id: string) => {
    return apiClient.get(`/dealers/${id}`);
  },
  create: (data: any) => {
    return apiClient.post('/dealers', data);
  },
  update: (id: string, data: any) => {
    return apiClient.put(`/dealers/${id}`, data);
  },
  delete: (id: string) => {
    return apiClient.delete(`/dealers/${id}`);
  },
  getStats: () => {
    return apiClient.get('/dealers/stats');
  },
};

// Accounting API
export const accountingApi = {
  getTransactions: (params?: { dateRange?: string; type?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.dateRange) queryParams.append('date_range', params.dateRange);
    if (params?.type) queryParams.append('type', params.type);

    const queryString = queryParams.toString();
    return apiClient.get(`/accounting/transactions${queryString ? '?' + queryString : ''}`);
  },
  getInvoices: () => {
    return apiClient.get('/accounting/invoices');
  },
  createTransaction: (data: any) => {
    return apiClient.post('/accounting/transactions', data);
  },
  getStats: () => {
    return apiClient.get('/accounting/stats');
  },
};

// Reports API
export const reportsApi = {
  getStats: () => {
    return apiClient.get('/reports/stats');
  },
  getFileTypeStats: () => {
    return apiClient.get('/reports/file-types');
  },
  generateReport: (params: any) => {
    return apiClient.post('/reports/generate', params);
  },
  getReports: () => {
    return apiClient.get('/reports');
  },
};

// Documents API
export const documentsApi = {
  getAll: (params?: { search?: string; type?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.type) queryParams.append('type', params.type);

    const queryString = queryParams.toString();
    return apiClient.get(`/documents${queryString ? '?' + queryString : ''}`);
  },
  upload: (formData: FormData) => {
    return apiClient.upload('/documents/upload', formData);
  },
  delete: (id: string) => {
    return apiClient.delete(`/documents/${id}`);
  },
  getStats: () => {
    return apiClient.get('/documents/stats');
  },
};

// Policy API
export const policyApi = {
  getAll: (params?: { search?: string; status?: string; limit?: number }) => {
    if (!params) return apiClient.get('/policies');

    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );

    const queryParams = new URLSearchParams(filteredParams).toString();
    return apiClient.get(`/policies${queryParams ? '?' + queryParams : ''}`);
  },
  getById: (id: string) => {
    return apiClient.get(`/policies/${id}`);
  },
  create: (data: any) => {
    return apiClient.post('/policies', data);
  },
  update: (id: string, data: any) => {
    return apiClient.put(`/policies/${id}`, data);
  },
  delete: (id: string) => {
    return apiClient.delete(`/policies/${id}`);
  },
  getRecent: (limit?: number) => {
    const queryParams = limit ? `?limit=${limit}` : '';
    return apiClient.get(`/policies/recent${queryParams}`);
  },
};

// Claims API
export const claimsApi = {
  getAll: (params?: { search?: string; status?: string; limit?: number }) => {
    if (!params) return apiClient.get('/claims');

    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );

    const queryParams = new URLSearchParams(filteredParams).toString();
    return apiClient.get(`/claims${queryParams ? '?' + queryParams : ''}`);
  },
  getById: (id: string) => {
    return apiClient.get(`/claims/${id}`);
  },
  create: (data: any) => {
    return apiClient.post('/claims', data);
  },
  update: (id: string, data: any) => {
    return apiClient.put(`/claims/${id}`, data);
  },
  getPending: () => {
    return apiClient.get('/claims/pending');
  },
};

// User API
export const userApi = {
  getAll: () => {
    return apiClient.get('/users');
  },
  getById: (id: string) => {
    return apiClient.get(`/users/${id}`);
  },
  create: (data: any) => {
    return apiClient.post('/users', data);
  },
  update: (id: string, data: any) => {
    return apiClient.put(`/users/${id}`, data);
  },
  delete: (id: string) => {
    return apiClient.delete(`/users/${id}`);
  },
};

