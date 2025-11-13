import { NextResponse } from 'next/server'
import { getAuditLogStats } from '@/lib/actions/audit-logs'

export async function GET(request: Request) {
  try {
    const stats = await getAuditLogStats()
    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('[API] Get audit log stats error:', error)
    return NextResponse.json(
      { error: error.message || 'İstatistikler yüklenemedi' },
      { status: 500 }
    )
  }
}

