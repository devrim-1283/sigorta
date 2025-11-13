import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        display_name: true,
        description: true,
        // permissions: true, // Column doesn't exist in database yet
        created_at: true,
        updated_at: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    })

    return NextResponse.json({
      roles: roles.map(r => ({
        ...r,
        id: Number(r.id),
        permissions: null, // Add null for compatibility
      })),
    })
  } catch (error: any) {
    console.error('Get roles error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch roles' },
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
    const { name, description, permissions } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Rol adı gerekli' },
        { status: 400 }
      )
    }

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name },
    })

    if (existingRole) {
      return NextResponse.json(
        { error: 'Bu rol adı zaten kullanılıyor' },
        { status: 400 }
      )
    }

    // Create role
    const role = await prisma.role.create({
      data: {
        name,
        display_name: name, // Use name as display_name if not provided
        description: description || null,
        // permissions: permissions || null, // Column doesn't exist in database yet
        created_at: new Date(),
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      role: {
        ...role,
        id: Number(role.id),
      },
    })
  } catch (error: any) {
    console.error('Create role error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create role' },
      { status: 500 }
    )
  }
}

