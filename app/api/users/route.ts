import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      include: {
        role: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    return NextResponse.json({
      users: users.map(u => ({
        ...u,
        id: Number(u.id),
        role_id: Number(u.role_id),
        password: undefined, // Don't send password hashes
      })),
    })
  } catch (error: any) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ad_soyad, email, telefon, tc_no, password, role_id, aktif } = body

    if (!ad_soyad || !email || !password || !role_id) {
      return NextResponse.json(
        { error: 'Ad soyad, email, şifre ve rol gerekli' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu email adresi zaten kullanılıyor' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        ad_soyad,
        email,
        telefon: telefon || null,
        tc_no: tc_no || null,
        password: hashedPassword,
        role_id: BigInt(role_id),
        aktif: aktif !== undefined ? aktif : true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        role: true,
      },
    })

    return NextResponse.json({
      user: {
        ...user,
        id: Number(user.id),
        role_id: Number(user.role_id),
        password: undefined,
      },
    })
  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    )
  }
}

