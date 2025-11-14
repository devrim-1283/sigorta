import { NextRequest, NextResponse } from 'next/server'
import { getSMSLogs } from '@/lib/actions/sms'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '50')
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined

    const result = await getSMSLogs({
      page,
      perPage,
      search,
      status,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[API] SMS logs error:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

