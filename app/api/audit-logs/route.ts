import { NextResponse } from 'next/server'
import { getAuditLogs } from '@/lib/actions/audit-logs'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    const params = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
      action: searchParams.get('action') as any,
      entityType: searchParams.get('entityType') as any,
      search: searchParams.get('search') || undefined,
    }

    const result = await getAuditLogs(params)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[API] Get audit logs error:', error)
    return NextResponse.json(
      { error: error.message || 'Loglar yüklenemedi' },
      { status: 500 }
    )
  }
}

