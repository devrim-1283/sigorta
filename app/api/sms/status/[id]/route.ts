import { NextRequest, NextResponse } from 'next/server'
import { updateSMSStatus } from '@/lib/actions/sms'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const smsLogId = parseInt(params.id)

    if (isNaN(smsLogId)) {
      return NextResponse.json(
        { error: 'Geçersiz SMS ID' },
        { status: 400 }
      )
    }

    const result = await updateSMSStatus(smsLogId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        status: result.status,
        statusDescription: result.statusDescription,
        deliveredDate: result.deliveredDate,
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Durum güncellenemedi' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[API] SMS status update error:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

