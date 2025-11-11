import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { resolveDocumentPath, STORAGE_ROOT, DOCUMENTS_STORAGE_PATH } from '@/lib/storage'
import { existsSync, createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { join, basename } from 'path'

export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    }

    const id = Number(params.id)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Geçersiz evrak numarası' }, { status: 400 })
    }

    const document = await prisma.document.findUnique({
      where: { id: BigInt(id) },
    })

    if (!document) {
      return NextResponse.json({ error: 'Evrak bulunamadı' }, { status: 404 })
    }

    console.log('[Download] Document found:', {
      id: document.id.toString(),
      dosya_yolu: document.dosya_yolu,
      dosya_adı: (document as any).dosya_adı,
    })

    // Resolve file path
    let filePath = resolveDocumentPath(document.dosya_yolu)
    console.log('[Download] Resolved path:', filePath)
    console.log('[Download] STORAGE_ROOT:', STORAGE_ROOT)

    // If primary path doesn't exist, try alternatives
    if (!filePath || !existsSync(filePath)) {
      console.warn('[Download] Primary path not found, trying alternatives...')
      console.warn('[Download] Original stored path:', document.dosya_yolu)
      
      const fileName = basename(document.dosya_yolu)
      const originalPath = document.dosya_yolu
      
      // Build comprehensive list of alternative paths
      const alternativePaths = [
        // Primary resolved path (already tried, but log it)
        filePath,
        // Storage paths
        join(STORAGE_ROOT, originalPath),
        join(STORAGE_ROOT, 'documents', fileName),
        join(STORAGE_ROOT, fileName),
        // Public uploads paths (legacy)
        join(process.cwd(), 'public', originalPath),
        join(process.cwd(), 'public', 'uploads', 'documents', fileName),
        join(process.cwd(), 'public', 'uploads', originalPath.replace(/^documents\//, '')),
        // Process cwd paths
        join(process.cwd(), 'storage', originalPath),
        join(process.cwd(), 'storage', 'documents', fileName),
        join(process.cwd(), originalPath),
        // Direct filename in various locations
        join(process.cwd(), 'public', fileName),
        join(process.cwd(), 'storage', fileName),
      ].filter(Boolean) // Remove null/undefined paths

      let foundPath: string | null = null
      for (const altPath of alternativePaths) {
        console.log('[Download] Trying alternative path:', altPath)
        if (existsSync(altPath)) {
          console.log('[Download] Found file at:', altPath)
          foundPath = altPath
          break
        }
      }

      if (!foundPath) {
        console.error('[Download] File not found in any location')
        console.error('[Download] Original path:', document.dosya_yolu)
        console.error('[Download] All tried paths:', alternativePaths)
        return NextResponse.json(
          { 
            error: 'Dosya bulunamadı',
            details: `Dosya yolu: ${document.dosya_yolu}`,
          },
          { status: 404 }
        )
      }

      filePath = foundPath
    }

    // Verify file exists and get stats
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
    }

    const stats = await stat(filePath)
    if (stats.size === 0) {
      console.warn('[Download] File exists but is empty:', filePath)
    }

    // Create read stream
    const stream = createReadStream(filePath)
    
    // Get original filename
    const originalName =
      (document as any).dosya_adı ||
      (document as any).belge_adi ||
      document.dosya_yolu?.split('/').pop() ||
      `evrak-${id}.pdf`

    const url = new URL(request.url)
    const isInline = url.searchParams.get('inline') === '1'

    // Return file stream
    return new Response(stream as any, {
      status: 200,
      headers: {
        'Content-Type': document.mime_type || 'application/pdf',
        'Content-Length': stats.size.toString(),
        'Content-Disposition': `${isInline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(originalName)}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: any) {
    console.error('[Download] Error:', error)
    console.error('[Download] Error stack:', error?.stack)
    return NextResponse.json(
      { 
        error: 'Dosya indirme hatası',
        message: error?.message || 'Bilinmeyen hata',
      },
      { status: 500 }
    )
  }
}

