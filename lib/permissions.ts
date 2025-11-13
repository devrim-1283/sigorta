import { type UserRole } from './role-config'

/**
 * Check if user can view dealer information (dealer name, dealer details)
 * Note: birincil-admin can view dealer info but dealer name will be hidden as "Bilinmiyor"
 */
export function canViewDealerInfo(role: UserRole): boolean {
  return role === 'superadmin' || role === 'bayi' || role === 'birincil-admin'
}

/**
 * Check if user can view dealer payment amount
 */
export function canViewDealerPayment(role: UserRole): boolean {
  return role === 'superadmin' || role === 'birincil-admin'
}

/**
 * Check if user can view dealer payment document
 * Note: Currently no one can view dealer payment document per requirements
 */
export function canViewDealerPaymentDocument(role: UserRole): boolean {
  return false // Per requirements, no one can view dealer payment document
}

/**
 * Check if user can edit customer information
 */
export function canEditCustomer(role: UserRole): boolean {
  return role === 'superadmin' || role === 'birincil-admin' || role === 'ikincil-admin' || role === 'operasyon'
}

/**
 * Check if user can upload application documents (başvuru evrakları)
 */
export function canUploadApplicationDocuments(role: UserRole): boolean {
  return role === 'superadmin' || role === 'birincil-admin' || role === 'evrak-birimi' || role === 'operasyon'
}

/**
 * Check if user can upload result documents (süreç evrakları)
 */
export function canUploadResultDocuments(role: UserRole): boolean {
  return role === 'superadmin' || role === 'birincil-admin' || role === 'ikincil-admin' || role === 'operasyon'
}

/**
 * Check if user can close customer file
 */
export function canCloseFile(role: UserRole): boolean {
  return role === 'superadmin' || role === 'birincil-admin' || role === 'ikincil-admin'
}

/**
 * Check if user can create new customers
 */
export function canCreateCustomer(role: UserRole): boolean {
  return role === 'superadmin' || role === 'birincil-admin' || role === 'ikincil-admin' || role === 'evrak-birimi' || role === 'operasyon'
}

/**
 * Check if user can create new dealers
 */
export function canCreateDealer(role: UserRole): boolean {
  return role === 'superadmin'
}

/**
 * Check if user can update customer status
 */
export function canUpdateCustomerStatus(role: UserRole): boolean {
  return role === 'superadmin' || role === 'birincil-admin' || role === 'ikincil-admin' || role === 'operasyon'
}

/**
 * Check if user can view dealer code (dealer_id) but not dealer name
 */
export function canViewDealerCode(role: UserRole): boolean {
  return role === 'superadmin' || role === 'birincil-admin'
}

/**
 * Check if user can manage dealer payment (edit)
 */
export function canManageDealerPayment(role: UserRole): boolean {
  return role === 'superadmin' || role === 'evrak-birimi'
}

