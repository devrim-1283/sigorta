// API Client - Server Actions Wrapper
// Bu dosya mevcut API interface'ini korur ama server actions kullanır

import * as authActions from './actions/auth'
import * as customerActions from './actions/customers'
import * as dealerActions from './actions/dealers'
import * as documentActions from './actions/documents'
import * as paymentActions from './actions/payments'
import * as dashboardActions from './actions/dashboard'
import * as notificationActions from './actions/notifications'
import * as userActions from './actions/users'
import * as policyActions from './actions/policies'
import * as claimActions from './actions/claims'
import * as fileTypeActions from './actions/file-types'

// API Client class - now uses server actions internally
class ApiClient {
  // Token methods kept for compatibility (but not used with NextAuth)
  setToken(token: string | null) {
    // No-op with NextAuth (uses httpOnly cookies)
  }

  // Generic request method (deprecated, kept for compatibility)
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    throw new Error('Direct API requests deprecated. Use server actions instead.')
  }

  // HTTP methods (deprecated)
  async get<T>(endpoint: string): Promise<T> {
    throw new Error('Use server actions instead')
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    throw new Error('Use server actions instead')
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    throw new Error('Use server actions instead')
  }

  async delete<T>(endpoint: string): Promise<T> {
    throw new Error('Use server actions instead')
  }
}

export const apiClient = new ApiClient()

// Auth API
export const authApi = {
  login: async (credentials: { email?: string; phone?: string; tc_no?: string; password: string }) => {
    const result = await authActions.authenticate(credentials)
    if (!result.success) {
      throw new Error(result.error)
    }
    return { success: true }
  },

  logout: async () => {
    await authActions.logoutUser()
    return { success: true }
  },

  me: async () => {
    const user = await authActions.getCurrentUser()
    if (!user) {
      throw new Error('Not authenticated')
    }
    return { user }
  },
}

// Customer API
export const customerApi = {
  list: async (params?: { search?: string; status?: string; page?: number; perPage?: number }) => {
    return await customerActions.getCustomers(params)
  },

  get: async (id: number) => {
    return await customerActions.getCustomer(id)
  },

  create: async (data: any) => {
    return await customerActions.createCustomer(data)
  },

  update: async (id: number, data: any) => {
    return await customerActions.updateCustomer(id, data)
  },

  delete: async (id: number) => {
    return await customerActions.deleteCustomer(id)
  },

  closeFile: async (id: number, reason?: string) => {
    return await customerActions.closeCustomerFile(id, reason)
  },

  addNote: async (id: number, content: string) => {
    return await customerActions.addCustomerNote(id, content)
  },
}

// Dealer API
export const dealerApi = {
  list: async (params?: { search?: string; status?: string }) => {
    return await dealerActions.getDealers(params)
  },

  get: async (id: number) => {
    return await dealerActions.getDealer(id)
  },

  create: async (data: any) => {
    return await dealerActions.createDealer(data)
  },

  update: async (id: number, data: any) => {
    return await dealerActions.updateDealer(id, data)
  },

  delete: async (id: number) => {
    return await dealerActions.deleteDealer(id)
  },

  getStats: async () => {
    return await dealerActions.getDealerStats()
  },
}

// Document API
export const documentApi = {
  list: async (params?: { search?: string; type?: string; status?: string; customerId?: number }) => {
    return await documentActions.getDocuments(params)
  },

  get: async (id: number) => {
    return await documentActions.getDocument(id)
  },

  upload: async (formData: FormData) => {
    return await documentActions.uploadDocument(formData)
  },

  update: async (id: number, data: any) => {
    return await documentActions.updateDocument(id, data)
  },

  delete: async (id: number) => {
    return await documentActions.deleteDocument(id)
  },

  download: async (id: number) => {
    return await documentActions.getDocumentDownloadUrl(id)
  },
}

// Payment API
export const paymentApi = {
  list: async (params?: { search?: string; status?: string; customerId?: number }) => {
    return await paymentActions.getPayments(params)
  },

  get: async (id: number) => {
    return await paymentActions.getPayment(id)
  },

  create: async (data: any) => {
    return await paymentActions.createPayment(data)
  },

  update: async (id: number, data: any) => {
    return await paymentActions.updatePayment(id, data)
  },

  delete: async (id: number) => {
    return await paymentActions.deletePayment(id)
  },
}

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    return await dashboardActions.getDashboardStats()
  },
}

// Notification API
export const notificationApi = {
  list: async () => {
    return await notificationActions.getNotifications()
  },

  markAsRead: async (id: number) => {
    return await notificationActions.markNotificationAsRead(id)
  },

  markAsUnread: async (id: number) => {
    return await notificationActions.markNotificationAsUnread(id)
  },

  markAllAsRead: async () => {
    return await notificationActions.markAllNotificationsAsRead()
  },

  delete: async (id: number) => {
    return await notificationActions.deleteNotification(id)
  },
}

// User API
export const userApi = {
  list: async () => {
    return await userActions.getUsers()
  },

  create: async (data: any) => {
    return await userActions.createUser(data)
  },

  update: async (id: number, data: any) => {
    return await userActions.updateUser(id, data)
  },

  delete: async (id: number) => {
    return await userActions.deleteUser(id)
  },
}

// Policy API
export const policyApi = {
  list: async (params?: { search?: string; status?: string; limit?: number }) => {
    return await policyActions.getPolicies(params)
  },

  getRecent: async (limit: number = 5) => {
    return await policyActions.getPolicies({ limit })
  },

  get: async (id: number) => {
    return await policyActions.getPolicy(id)
  },

  create: async (data: any) => {
    return await policyActions.createPolicy(data)
  },

  update: async (id: number, data: any) => {
    return await policyActions.updatePolicy(id, data)
  },

  delete: async (id: number) => {
    return await policyActions.deletePolicy(id)
  },
}

// Claim API
export const claimApi = {
  list: async (params?: { search?: string; status?: string; limit?: number }) => {
    return await claimActions.getClaims(params)
  },

  getPending: async () => {
    return await claimActions.getPendingClaims()
  },

  create: async (data: any) => {
    return await claimActions.createClaim(data)
  },
}

// File Type API
export const fileTypeApi = {
  list: async () => {
    return await fileTypeActions.getFileTypes()
  },
}

// Reports API (alias for dashboard)
export const reportsApi = {
  getStats: async () => {
    return await dashboardActions.getDashboardStats()
  },
}

// Documents API (alias for documentApi for compatibility)
export const documentsApi = documentApi

// Claims API (alias for claimApi for compatibility)
export const claimsApi = claimApi

// Accounting API (placeholder - to be implemented)
export const accountingApi = {
  list: async (params?: any) => {
    return { transactions: [] }
  },
  getStats: async () => {
    return { 
      totalRevenue: 0,
      totalExpenses: 0,
      pendingPayments: 0,
      balance: 0
    }
  },
}

// Export all APIs
export default {
  auth: authApi,
  customers: customerApi,
  dealers: dealerApi,
  documents: documentApi,
  payments: paymentApi,
  dashboard: dashboardApi,
  notifications: notificationApi,
  users: userApi,
  policies: policyApi,
  claims: claimApi,
  fileTypes: fileTypeApi,
  reports: reportsApi,
  accounting: accountingApi,
}
