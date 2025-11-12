import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import archiver from 'archiver'
import { PassThrough } from 'stream'
import { resolveDocumentPath } from '@/lib/storage'
import { existsSync, createReadStream } from 'fs'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    }

    // Only superadmin can download all documents
    if (session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
    }

    // Get all non-deleted documents
    const documents = await prisma.document.findMany({
      where: {
        deleted_at: null,
      },
      include: {
        customer: {
          select: {
            id: true,
            ad_soyad: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    if (documents.length === 0) {
      return NextResponse.json({ error: 'İndirilecek evrak bulunamadı' }, { status: 404 })
    }

    // Create zip archive
    const archive = archiver('zip', { zlib: { level: 9 } })
    const stream = new PassThrough()

    archive.on('error', (error) => {
      stream.destroy(error)
    })

    archive.pipe(stream)

    // Add each document to the zip
    let addedCount = 0
    for (const doc of documents) {
      const filePath = resolveDocumentPath(doc.dosya_yolu)
      
      if (filePath && existsSync(filePath)) {
        const customerName = doc.customer?.ad_soyad?.replace(/[^a-zA-Z0-9]/g, '_') || 'Bilinmeyen'
        const fileName = (doc as any).dosya_adı || 
                        (doc as any).belge_adi || 
                        `evrak-${doc.id}.pdf`
        
        // Organize by customer: customer_name/document_name
        const zipPath = `${customerName}/${fileName}`
        archive.append(createReadStream(filePath), { name: zipPath })
        addedCount++
      }
    }

    if (addedCount === 0) {
      return NextResponse.json({ error: 'Hiçbir evrak dosyası bulunamadı' }, { status: 404 })
    }

    archive.finalize()

    const zipFileName = `tum-evraklar-${new Date().toISOString().split('T')[0]}.zip`

    return new Response(stream as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(zipFileName)}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error: any) {
    console.error('[Download All Documents] Error:', error)
    return NextResponse.json(
      { 
        error: 'ZIP oluşturma hatası',
        message: error?.message || 'Bilinmeyen hata',
      },
      { status: 500 }
    )
  }
}

