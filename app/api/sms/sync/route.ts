import { NextRequest, NextResponse } from 'next/server'
import { syncSMSStatuses } from '@/lib/actions/sms'

export async function POST(request: NextRequest) {
  try {
    // Optional: Add API key authentication for cron jobs
    const authHeader = request.headers.get('authorization')
    const apiKey = process.env.CRON_API_KEY

    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await syncSMSStatuses()

    if (result.success) {
      return NextResponse.json({
        success: true,
        updated: result.updated,
        failed: result.failed,
        total: result.total,
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Senkronizasyon başarısız' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[API] SMS sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

