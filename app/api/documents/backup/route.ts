import archiver, { type Archiver } from 'archiver'
import { PassThrough } from 'stream'
import { auth } from '@/auth'
import { existsSync } from 'fs'
import { readdir } from 'fs/promises'
import { join, relative } from 'path'
import { DOCUMENTS_STORAGE_PATH } from '@/lib/storage'

export const runtime = 'nodejs'

async function appendDirectory(dir: string, archive: Archiver, baseDir: string) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      await appendDirectory(fullPath, archive, baseDir)
    } else {
      archive.file(fullPath, { name: relative(baseDir, fullPath).replace(/\\/g, '/') })
    }
  }
}

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return new Response('Yetkisiz', { status: 401 })
  }

  if (session.user.role !== 'superadmin') {
    return new Response('Bu işlem için yetkiniz yok', { status: 403 })
  }

  if (!existsSync(DOCUMENTS_STORAGE_PATH)) {
    return new Response('Yedeklenecek evrak bulunamadı', { status: 404 })
  }

  const archive = archiver('zip', { zlib: { level: 9 } })
  const stream = new PassThrough()

  archive.on('error', (error) => {
    stream.destroy(error)
  })

  archive.pipe(stream)
  await appendDirectory(DOCUMENTS_STORAGE_PATH, archive, DOCUMENTS_STORAGE_PATH)
  archive.finalize()

  return new Response(stream as any, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="evrak-yedek.zip"',
      'Cache-Control': 'no-cache',
    },
  })
}

