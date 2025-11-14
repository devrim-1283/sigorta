import { NextRequest, NextResponse } from 'next/server'
import { sendManualSMS } from '@/lib/actions/sms'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, message, customerId, recipientName } = body

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Telefon ve mesaj gereklidir' },
        { status: 400 }
      )
    }

    const result = await sendManualSMS({
      phone,
      message,
      customerId,
      recipientName,
    })

    if (result.success) {
      return NextResponse.json({ success: true, jobId: result.jobId })
    } else {
      return NextResponse.json(
        { error: result.error || 'SMS gönderilemedi' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[API] SMS send error:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

