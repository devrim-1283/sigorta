import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import archiver, { type Archiver } from 'archiver'
import { PassThrough } from 'stream'
import { resolveDocumentPath } from '@/lib/storage'
import { existsSync, createReadStream } from 'fs'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    }

    const customerId = Number(params.id)
    if (Number.isNaN(customerId)) {
      return NextResponse.json({ error: 'Geçersiz müşteri ID' }, { status: 400 })
    }

    // Get customer and their documents
    const customer = await prisma.customer.findUnique({
      where: { id: BigInt(customerId) },
      include: {
        documents: true,
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 })
    }

    if (customer.documents.length === 0) {
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
    for (const doc of customer.documents) {
      const filePath = resolveDocumentPath(doc.dosya_yolu)
      
      if (filePath && existsSync(filePath)) {
        const fileName = (doc as any).dosya_adı || 
                        (doc as any).belge_adi || 
                        `evrak-${doc.id}.pdf`
        archive.append(createReadStream(filePath), { name: fileName })
      }
    }

    archive.finalize()

    const customerName = customer.ad_soyad.replace(/[^a-zA-Z0-9]/g, '_')
    const zipFileName = `${customerName}_evraklar_${Date.now()}.zip`

    return new Response(stream as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(zipFileName)}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error: any) {
    console.error('[Zip Download] Error:', error)
    return NextResponse.json(
      { 
        error: 'ZIP oluşturma hatası',
        message: error?.message || 'Bilinmeyen hata',
      },
      { status: 500 }
    )
  }
}

