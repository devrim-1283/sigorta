/**
 * File Types Configuration
 * Defines the 4 main file types and their required documents
 */

export interface RequiredDocument {
  name: string
  displayOrder: number
  required: boolean
}

export interface FileTypeConfig {
  id: number
  name: string
  description: string
  requiredDocuments: RequiredDocument[]
}

// Type aliases for convenience
export type FileType = number // 1 | 2 | 3 | 4
export type DocumentType = string // Document name

export const FILE_TYPES: FileTypeConfig[] = [
  {
    id: 1,
    name: 'Değer Kaybı',
    description: 'Kaza sonrası araç değer kaybı dosyası',
    requiredDocuments: [
      { name: 'Müşteri vekaleti', displayOrder: 1, required: true },
      { name: 'Eksper raporu', displayOrder: 2, required: true },
      { name: 'Kaza tutanağı', displayOrder: 3, required: true },
      { name: 'Mağdur ruhsatı', displayOrder: 4, required: true },
      { name: 'Olay yeri resimleri', displayOrder: 5, required: true },
      { name: 'Onarım resimleri', displayOrder: 6, required: true },
      { name: 'IBAN bilgisi', displayOrder: 7, required: true },
    ],
  },
  {
    id: 2,
    name: 'Parça ve İşçilik Farkı',
    description: 'Onarım sonrası parça ve işçilik farkı dosyası',
    requiredDocuments: [
      { name: 'Vekalet', displayOrder: 1, required: true },
      { name: 'Parça farkını beyan eden resimler', displayOrder: 2, required: true },
      { name: 'Parça farkını beyan eden faturalar', displayOrder: 3, required: true },
      { name: 'Eksper raporu', displayOrder: 4, required: true },
      { name: 'Onarım resimleri', displayOrder: 5, required: true },
      { name: 'IBAN bilgisi', displayOrder: 6, required: true },
    ],
  },
  {
    id: 3,
    name: 'Araç Mahrumiyeti',
    description: 'Araç kullanılamama nedeniyle mahuriyet tazminatı',
    requiredDocuments: [
      { name: 'Muvafakatname', displayOrder: 1, required: true },
      { name: 'Eksper raporu', displayOrder: 2, required: true },
      { name: 'Vekalet', displayOrder: 3, required: true },
      { name: 'Araç ruhsatı', displayOrder: 4, required: true },
      { name: 'IBAN bilgisi', displayOrder: 5, required: true },
    ],
  },
  {
    id: 4,
    name: 'Pert Farkı',
    description: 'Araç pert ilan edildiğinde değer farkı tazminatı',
    requiredDocuments: [
      // Pert Farkı için zorunlu evraklar henüz belirlenmemiş
      // İlerleyen süreçte eklenebilir
    ],
  },
]

/**
 * Get file type configuration by ID
 */
export function getFileTypeConfig(fileTypeId: number): FileTypeConfig | undefined {
  return FILE_TYPES.find((ft) => ft.id === fileTypeId)
}

/**
 * Get required documents for a file type
 */
export function getRequiredDocuments(fileTypeId: number): RequiredDocument[] {
  const config = getFileTypeConfig(fileTypeId)
  return config?.requiredDocuments || []
}

/**
 * Check if all required documents are uploaded for a customer
 */
export function areAllRequiredDocumentsUploaded(
  fileTypeId: number,
  uploadedDocumentNames: string[]
): boolean {
  const required = getRequiredDocuments(fileTypeId).filter((doc) => doc.required)
  
  // If no required documents (like Pert Farkı), return true
  if (required.length === 0) return true
  
  // Check if all required documents are in the uploaded list
  return required.every((reqDoc) =>
    uploadedDocumentNames.some((uploaded) =>
      uploaded.toLowerCase().includes(reqDoc.name.toLowerCase())
    )
  )
}

/**
 * Calculate document completion percentage
 */
export function getDocumentCompletionPercentage(
  fileTypeId: number,
  uploadedDocumentNames: string[]
): number {
  const required = getRequiredDocuments(fileTypeId).filter((doc) => doc.required)
  
  if (required.length === 0) return 100
  
  const uploadedCount = required.filter((reqDoc) =>
    uploadedDocumentNames.some((uploaded) =>
      uploaded.toLowerCase().includes(reqDoc.name.toLowerCase())
    )
  ).length
  
  return Math.round((uploadedCount / required.length) * 100)
}
