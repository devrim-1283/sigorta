import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { resolveDocumentPath } from '@/lib/storage'
import { existsSync, createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { join } from 'path'

export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()

  if (!session?.user) {
    return new Response('Yetkisiz', { status: 401 })
  }

  const id = Number(params.id)
  if (Number.isNaN(id)) {
    return new Response('Geçersiz evrak numarası', { status: 400 })
  }

  const document = await prisma.document.findUnique({
    where: { id: BigInt(id) },
  })

  if (!document) {
    return new Response('Evrak bulunamadı', { status: 404 })
  }

  const filePath = resolveDocumentPath(document.dosya_yolu)
  
  if (!filePath) {
    console.error('[Download] No file path resolved for:', document.dosya_yolu)
    return new Response('Dosya yolu bulunamadı', { status: 404 })
  }

  if (!existsSync(filePath)) {
    console.error('[Download] File not found at path:', filePath)
    console.error('[Download] Original stored path:', document.dosya_yolu)
    console.error('[Download] STORAGE_ROOT:', process.env.DOCUMENT_STORAGE_ROOT || 'default')
    
    // Try alternative paths
    const alternativePaths = [
      // Try with public/uploads
      join(process.cwd(), 'public', 'uploads', 'documents', path.basename(document.dosya_yolu)),
      // Try direct path
      join(process.cwd(), document.dosya_yolu),
      // Try with storage root
      join(process.cwd(), 'storage', document.dosya_yolu),
    ]
    
    for (const altPath of alternativePaths) {
      if (existsSync(altPath)) {
        console.log('[Download] Found file at alternative path:', altPath)
        const stats = await stat(altPath)
        const stream = createReadStream(altPath)
        const url = new URL(request.url)
        const isInline = url.searchParams.get('inline') === '1'
        const originalName =
          (document as any).dosya_adı ||
          document.dosya_yolu?.split('/').pop() ||
          'evrak'

        return new Response(stream as any, {
          headers: {
            'Content-Type': document.mime_type || 'application/octet-stream',
            'Content-Length': stats.size.toString(),
            'Content-Disposition': `${isInline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(originalName)}"`,
            'Cache-Control': 'no-cache',
          },
        })
      }
    }
    
    return new Response('Dosya bulunamadı', { status: 404 })
  }

  const stats = await stat(filePath)
  const stream = createReadStream(filePath)
  const url = new URL(request.url)
  const isInline = url.searchParams.get('inline') === '1'
  const originalName =
    (document as any).dosya_adı ||
    document.dosya_yolu?.split('/').pop() ||
    'evrak'

  return new Response(stream as any, {
    headers: {
      'Content-Type': document.mime_type || 'application/octet-stream',
      'Content-Length': stats.size.toString(),
      'Content-Disposition': `${isInline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(originalName)}"`,
      'Cache-Control': 'no-cache',
    },
  })
}

