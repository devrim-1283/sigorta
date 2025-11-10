import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'

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
    const { ad_soyad, email, telefon, tc_no, password, role_id, aktif } = body

    const updateData: any = {
      ad_soyad,
      email,
      telefon: telefon || null,
      tc_no: tc_no || null,
      aktif: aktif !== undefined ? aktif : true,
      updated_at: new Date(),
    }

    if (role_id) {
      updateData.role_id = BigInt(role_id)
    }

    // Only update password if provided
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({
      where: {
        id: BigInt(params.id),
      },
      data: updateData,
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
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
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

    // Don't allow deleting superadmin users
    const user = await prisma.user.findUnique({
      where: { id: BigInt(params.id) },
      include: { role: true },
    })

    if (user?.role.name === 'superadmin') {
      return NextResponse.json(
        { error: 'Süper admin kullanıcıları silinemez' },
        { status: 403 }
      )
    }

    await prisma.user.delete({
      where: {
        id: BigInt(params.id),
      },
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error: any) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    )
  }
}

