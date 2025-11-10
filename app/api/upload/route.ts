import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
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

    // Validate file type
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

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'documents')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const ext = file.name.split('.').pop()
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`
    const filepath = join(uploadDir, filename)
    const relativePath = `/uploads/documents/${filename}`

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Save to database
    const document = await prisma.document.create({
      data: {
        customer_id: BigInt(customer_id),
        belge_adi: belge_adi || file.name,
        dosya_yolu: relativePath,
        dosya_adi_orijinal: file.name,
        mime_type: file.type,
        dosya_boyutu: BigInt(file.size),
        tip: tip || 'Diğer',
        durum: 'Beklemede',
        uploaded_by: BigInt(session.user.id),
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

