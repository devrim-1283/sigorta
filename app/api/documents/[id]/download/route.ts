import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { resolveDocumentPath } from '@/lib/storage'
import { existsSync, createReadStream } from 'fs'
import { stat } from 'fs/promises'
import path from 'path'

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
  if (!filePath || !existsSync(filePath)) {
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

