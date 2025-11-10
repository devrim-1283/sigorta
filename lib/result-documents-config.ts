/**
 * Result Documents Configuration
 * Defines the 8 types of result documents (Sonuç Evrakları)
 * that can be uploaded by İkincil Admin and viewed by all
 */

export interface ResultDocumentType {
  id: number
  name: string
  description?: string
  displayOrder: number
}

export const RESULT_DOCUMENT_TYPES: ResultDocumentType[] = [
  {
    id: 1,
    name: 'Sigortaya çekilen ihtarname',
    description: 'Sigorta şirketine gönderilen resmi ihtarname belgesi',
    displayOrder: 1,
  },
  {
    id: 2,
    name: 'Tahkim başvuru dilekçesi',
    description: 'Tahkim kuruluna yapılan başvuru dilekçesi',
    displayOrder: 2,
  },
  {
    id: 3,
    name: 'Tahkim komisyonu nihai kararı',
    description: 'Tahkim komisyonunun verdiği nihai karar belgesi',
    displayOrder: 3,
  },
  {
    id: 4,
    name: 'Bilirkişi raporu',
    description: 'Mahkeme tarafından atanan bilirkişinin hazırladığı rapor',
    displayOrder: 4,
  },
  {
    id: 5,
    name: 'Sigortadan gelen ödeme dekontu',
    description: 'Sigorta şirketinden yapılan ödemenin dekont belgesi',
    displayOrder: 5,
  },
  {
    id: 6,
    name: 'Sistem tarafından yapılan ödeme',
    description: 'Sistem üzerinden müşteriye yapılan ödeme belgesi',
    displayOrder: 6,
  },
  {
    id: 7,
    name: 'Esnaf talimat evrakı',
    description: 'Esnafa verilen talimat ve ödeme evrakları',
    displayOrder: 7,
  },
  {
    id: 8,
    name: 'İcra dilekçesi',
    description: 'İcra takibi için hazırlanan dilekçe',
    displayOrder: 8,
  },
]

/**
 * Get result document type by ID
 */
export function getResultDocumentType(id: number): ResultDocumentType | undefined {
  return RESULT_DOCUMENT_TYPES.find((type) => type.id === id)
}

/**
 * Get result document type by name
 */
export function getResultDocumentTypeByName(name: string): ResultDocumentType | undefined {
  return RESULT_DOCUMENT_TYPES.find(
    (type) => type.name.toLowerCase() === name.toLowerCase()
  )
}

/**
 * Check if a user role can upload result documents
 */
export function canUploadResultDocuments(roleName: string): boolean {
  const allowedRoles = ['superadmin', 'birincil-admin', 'ikincil-admin']
  return allowedRoles.includes(roleName.toLowerCase())
}

/**
 * Check if a user role can view result documents
 */
export function canViewResultDocuments(roleName: string): boolean {
  // Everyone can view result documents
  return true
}

/**
 * Check if a user role can delete result documents
 */
export function canDeleteResultDocuments(roleName: string): boolean {
  const allowedRoles = ['superadmin', 'birincil-admin', 'ikincil-admin']
  return allowedRoles.includes(roleName.toLowerCase())
}
