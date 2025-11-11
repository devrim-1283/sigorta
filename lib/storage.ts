import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export const STORAGE_ROOT = process.env.DOCUMENT_STORAGE_ROOT || join(process.cwd(), 'storage')
export const DOCUMENTS_RELATIVE_DIR = 'documents'
export const DOCUMENTS_STORAGE_PATH = join(STORAGE_ROOT, DOCUMENTS_RELATIVE_DIR)

export function ensureDocumentsDir() {
  if (!existsSync(DOCUMENTS_STORAGE_PATH)) {
    mkdirSync(DOCUMENTS_STORAGE_PATH, { recursive: true })
  }
}

export function getDocumentStoragePath(filename: string) {
  ensureDocumentsDir()
  return join(DOCUMENTS_STORAGE_PATH, filename)
}

export function getDocumentRelativePath(filename: string) {
  return `${DOCUMENTS_RELATIVE_DIR}/${filename}`.replace(/\\/g, '/')
}

export function resolveDocumentPath(storedPath: string | null | undefined) {
  if (!storedPath) return null
  
  // Normalize path - remove leading slash if present
  let normalized = storedPath.startsWith('/') ? storedPath.slice(1) : storedPath
  
  // Remove any leading 'public/' or 'storage/' prefixes that might be incorrectly stored
  normalized = normalized.replace(/^(public\/|storage\/)/, '')

  // Legacy uploads stored under public/uploads/documents
  if (normalized.startsWith('uploads/')) {
    return join(process.cwd(), 'public', normalized)
  }

  // If path starts with 'documents/', it's already relative to STORAGE_ROOT
  if (normalized.startsWith('documents/')) {
    const fullPath = join(STORAGE_ROOT, normalized)
    // Also check if it exists in public/uploads as fallback
    if (!existsSync(fullPath)) {
      const publicPath = join(process.cwd(), 'public', 'uploads', normalized)
      if (existsSync(publicPath)) {
        return publicPath
      }
    }
    return fullPath
  }

  // If path doesn't start with 'documents/', assume it's a filename and add documents/ prefix
  // This handles cases where only filename is stored
  if (!normalized.includes('/')) {
    const storagePath = join(DOCUMENTS_STORAGE_PATH, normalized)
    // Check if exists, if not try public/uploads
    if (!existsSync(storagePath)) {
      const publicPath = join(process.cwd(), 'public', 'uploads', 'documents', normalized)
      if (existsSync(publicPath)) {
        return publicPath
      }
    }
    return storagePath
  }

  // Default: join with STORAGE_ROOT
  return join(STORAGE_ROOT, normalized)
}

