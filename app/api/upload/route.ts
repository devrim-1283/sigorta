import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join, basename } from 'path'
import { existsSync } from 'fs'
import { fileTypeFromBuffer } from 'file-type'
import prisma from '@/lib/db'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
  try {
    // Check auth
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const customer_id = formData.get('customer_id') as string
    const belge_adi = formData.get('belge_adi') as string
    const tip = formData.get('tip') as string

    if (!file || !customer_id) {
      return NextResponse.json(
        { error: 'File ve customer_id gerekli' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Dosya boyutu 5MB\'dan büyük olamaz' },
        { status: 400 }
      )
    }

    // Validate file type (client-side MIME type check)
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Geçersiz dosya tipi' },
        { status: 400 }
      )
    }

    // Save file to memory first for content validation
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Validate actual file content (prevent MIME type spoofing)
    const fileType = await fileTypeFromBuffer(buffer)
    if (!fileType) {
      return NextResponse.json(
        { error: 'Dosya tipi tespit edilemedi. Geçersiz dosya.' },
        { status: 400 }
      )
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ]

    if (!allowedMimeTypes.includes(fileType.mime)) {
      return NextResponse.json(
        { error: `Geçersiz dosya içeriği. Beklenen: resim veya PDF, Tespit edilen: ${fileType.mime}` },
        { status: 400 }
      )
    }

    // Sanitize filename to prevent path traversal
    const sanitizeFilename = (filename: string): string => {
      const name = basename(filename)
      return name
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 255)
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'documents')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename with sanitized extension
    const timestamp = Date.now()
    const originalExt = file.name.split('.').pop() || fileType.ext || 'bin'
    const sanitizedExt = sanitizeFilename(originalExt).split('.').pop() || fileType.ext || 'bin'
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${sanitizedExt}`
    const filepath = join(uploadDir, filename)
    const relativePath = `/uploads/documents/${filename}`

    // Save file
    await writeFile(filepath, buffer)

    // Sanitize belge_adi to prevent path traversal
    const sanitizedBelgeAdi = sanitizeFilename(belge_adi || file.name)
    const sanitizedOriginalName = sanitizeFilename(file.name)

    // Save to database
    const document = await prisma.document.create({
      data: {
        customer_id: BigInt(customer_id),
        belge_adi: sanitizedBelgeAdi,
        dosya_yolu: relativePath,
        dosya_adi_orijinal: sanitizedOriginalName,
        mime_type: fileType.mime, // Use detected MIME type
        dosya_boyutu: BigInt(file.size),
        tip: tip || 'Diğer',
        durum: 'Beklemede',
        uploaded_by: BigInt(session.user.id),
        created_at: new Date(),
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      message: 'Dosya başarıyla yüklendi',
      document: {
        ...document,
        id: Number(document.id),
        customer_id: Number(document.customer_id),
        uploaded_by: Number(document.uploaded_by),
      },
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Dosya yüklenemedi' },
      { status: 500 }
    )
  }
}

