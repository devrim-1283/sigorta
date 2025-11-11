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
  const normalized = storedPath.startsWith('/') ? storedPath.slice(1) : storedPath

  // Legacy uploads stored under public/uploads/documents
  if (normalized.startsWith('uploads/')) {
    return join(process.cwd(), 'public', normalized)
  }

  return join(STORAGE_ROOT, normalized)
}

