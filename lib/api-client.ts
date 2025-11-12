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
import * as resultDocumentActions from './actions/result-documents'
import * as accountingActions from './actions/accounting'

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

  getAll: async (params?: { search?: string; status?: string; page?: number; per_page?: number }) => {
    // Map per_page to perPage for compatibility
    const mappedParams = params ? {
      ...params,
      perPage: params.per_page || params.page,
    } : undefined
    return await customerActions.getCustomers(mappedParams)
  },

  get: async (id: number | string) => {
    return await customerActions.getCustomer(typeof id === 'string' ? parseInt(id) : id)
  },

  create: async (data: any) => {
    try {
      console.log('[customerApi.create] Sending data to server action:', data)
      const result = await customerActions.createCustomer(data)
      console.log('[customerApi.create] Server action result:', result)
      return result
    } catch (error: any) {
      console.error('[customerApi.create] Server action error:', error)
      console.error('[customerApi.create] Error type:', typeof error)
      console.error('[customerApi.create] Error message:', error?.message)
      console.error('[customerApi.create] Error digest:', error?.digest)
      
      // Ensure error message is preserved and properly formatted
      // Create a new error with the message to avoid Next.js serialization issues
      const errorMessage = error?.message || 'Müşteri oluşturulurken bir hata oluştu'
      const customError: any = new Error(errorMessage)
      customError.isValidationError = (error as any)?.isValidationError || false
      customError.digest = (error as any)?.digest
      customError.message = errorMessage
      
      throw customError
    }
  },

  update: async (id: number | string, data: any) => {
    return await customerActions.updateCustomer(typeof id === 'string' ? parseInt(id) : id, data)
  },

  delete: async (id: number | string) => {
    return await customerActions.deleteCustomer(typeof id === 'string' ? parseInt(id) : id)
  },

  closeFile: async (id: number | string, reason?: string, accountingData?: {
    customerPayment?: number | string
    expenses?: number | string
    dealerCommission?: number | string
    netProfit?: number | string
  }) => {
    return await customerActions.closeCustomerFile(
      typeof id === 'string' ? parseInt(id) : id, 
      reason || '',
      accountingData
    )
  },

  addNote: async (id: number | string, content: string) => {
    return await customerActions.addCustomerNote(typeof id === 'string' ? parseInt(id) : id, content)
  },

  getById: async (id: number | string) => {
    return await customerActions.getCustomer(typeof id === 'string' ? parseInt(id) : id)
  },

  checkAndUpdateStatus: async (id: number | string) => {
    return await customerActions.checkAndUpdateCustomerStatus(typeof id === 'string' ? parseInt(id) : id)
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
  
  getAll: async () => {
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

// Accounting API
export const accountingApi = {
  list: async (params?: { type?: 'income' | 'expense'; startDate?: Date; endDate?: Date; page?: number; perPage?: number }) => {
    return await accountingActions.getAccountingTransactions(params)
  },

  getStats: async (params?: { startDate?: Date; endDate?: Date }) => {
    return await accountingActions.getAccountingStats(params)
  },

  create: async (data: {
    type: 'income' | 'expense'
    category?: string
    description?: string
    amount: number | string
    transaction_date: Date
    document_url?: string
  }) => {
    return await accountingActions.createAccountingTransaction(data)
  },

  update: async (id: number, data: any) => {
    return await accountingActions.updateAccountingTransaction(id, data)
  },

  delete: async (id: number) => {
    return await accountingActions.deleteAccountingTransaction(id)
  },
}

// Result Documents API
export const resultDocumentsApi = {
  list: async (customerId: number) => {
    return await resultDocumentActions.getResultDocuments(customerId)
  },

  getTypes: async () => {
    return await resultDocumentActions.getResultDocumentTypes()
  },

  upload: async (data: {
    customer_id: number
    result_document_type_id: number
    file_path: string
    file_name: string
    file_size: number
    mime_type: string
  }) => {
    return await resultDocumentActions.uploadResultDocument(data)
  },

  delete: async (id: number) => {
    return await resultDocumentActions.deleteResultDocument(id)
  },
}

// Export customer status check function
export const checkCustomerStatus = async (customerId: number) => {
  return await customerActions.checkAndUpdateCustomerStatus(customerId)
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
  resultDocuments: resultDocumentsApi,
}
