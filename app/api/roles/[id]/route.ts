import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { auth } from '@/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    // Don't allow changing system role names
    const existingRole = await prisma.role.findUnique({
      where: { id: BigInt(params.id) },
    })

    if (!existingRole) {
      return NextResponse.json({ error: 'Rol bulunamadı' }, { status: 404 })
    }

    const systemRoles = ['superadmin', 'birincil-admin', 'ikincil-admin', 'evrak-birimi', 'bayi', 'musteri']
    
    const updateData: any = {
      description: description || null,
      updated_at: new Date(),
    }

    // Only allow changing name if not a system role
    if (!systemRoles.includes(existingRole.name) && name) {
      updateData.name = name
    }

    const role = await prisma.role.update({
      where: {
        id: BigInt(params.id),
      },
      data: updateData,
    })

    return NextResponse.json({
      role: {
        ...role,
        id: Number(role.id),
      },
    })
  } catch (error: any) {
    console.error('Update role error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update role' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if role has any users
    const role = await prisma.role.findUnique({
      where: { id: BigInt(params.id) },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    if (!role) {
      return NextResponse.json({ error: 'Rol bulunamadı' }, { status: 404 })
    }

    // Don't allow deleting system roles
    const systemRoles = ['superadmin', 'birincil-admin', 'ikincil-admin', 'evrak-birimi', 'bayi', 'musteri']
    if (systemRoles.includes(role.name)) {
      return NextResponse.json(
        { error: 'Sistem rolleri silinemez' },
        { status: 403 }
      )
    }

    if (role._count.users > 0) {
      return NextResponse.json(
        { error: `Bu role sahip ${role._count.users} kullanıcı var. Önce kullanıcıları başka role taşıyın.` },
        { status: 400 }
      )
    }

    await prisma.role.delete({
      where: {
        id: BigInt(params.id),
      },
    })

    return NextResponse.json({ message: 'Role deleted successfully' })
  } catch (error: any) {
    console.error('Delete role error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete role' },
      { status: 500 }
    )
  }
}

