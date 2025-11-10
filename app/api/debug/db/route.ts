import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

/**
 * Debug endpoint to check database connection
 * ONLY FOR DEBUGGING - REMOVE IN PRODUCTION!
 */
export async function GET() {
  try {
    // Check database connection
    await prisma.$connect()

    // Count tables
    const usersCount = await prisma.user.count()
    const rolesCount = await prisma.role.count()
    const dealersCount = await prisma.dealer.count()
    const customersCount = await prisma.customer.count()

    // Check if demo admin exists
    const demoAdmin = await prisma.user.findUnique({
      where: { email: 'admin@sigorta.com' },
      select: {
        id: true,
        name: true,
        email: true,
        role_id: true,
        is_active: true,
        created_at: true,
      },
    })

    // Get all users (for debugging)
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role_id: true,
        is_active: true,
      },
      take: 10,
    })

    return NextResponse.json({
      status: 'OK',
      database: {
        connected: true,
        counts: {
          users: usersCount,
          roles: rolesCount,
          dealers: dealersCount,
          customers: customersCount,
        },
        demoAdmin: demoAdmin ? 'FOUND ✓' : 'NOT FOUND ✗',
        demoAdminDetails: demoAdmin,
        allUsers,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        hasAuthSecret: !!process.env.NEXTAUTH_SECRET,
      },
    })
  } catch (error: any) {
    console.error('Database debug error:', error)
    return NextResponse.json(
      {
        status: 'ERROR',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

