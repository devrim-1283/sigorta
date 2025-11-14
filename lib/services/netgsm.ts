/**
 * NetGSM SMS Service
 * API Documentation: https://www.netgsm.com.tr/dokuman/
 */

export interface SMSResult {
  success: boolean
  code?: string
  jobid?: string
  description?: string
  error?: string
}

export interface SMSStatusResult {
  success: boolean
  status?: number
  deliveredDate?: string
  errorCode?: number
  operator?: number
  error?: string
}

interface NetGSMSendRequest {
  msgheader: string
  messages: Array<{
    msg: string
    no: string
  }>
  encoding: string
  iysfilter: string
}

interface NetGSMReportRequest {
  jobids: string[]
  appname?: string
}

/**
 * Send SMS via NetGSM API
 */
export async function sendSMS(params: {
  phone: string
  message: string
  customerName?: string
}): Promise<SMSResult> {
  try {
    const username = process.env.NETGSM_USERNAME
    const password = process.env.NETGSM_PASSWORD
    const sender = process.env.NETGSM_SENDER || 'SEFFAF DAN'
    const apiUrl = process.env.NETGSM_API_URL || 'https://api.netgsm.com.tr'

    if (!username || !password) {
      console.error('[NetGSM] Missing credentials')
      return {
        success: false,
        error: 'NetGSM credentials not configured'
      }
    }

    // Normalize phone number (remove spaces, dashes, etc.)
    let normalizedPhone = params.phone.replace(/[\s\-\(\)]/g, '')
    
    // Remove leading 0 if present (for Turkish numbers)
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = normalizedPhone.substring(1)
    }
    
    // Ensure it starts with country code for international numbers
    if (normalizedPhone.length === 10 && !normalizedPhone.startsWith('90')) {
      normalizedPhone = '90' + normalizedPhone
    }

    // Create Basic Auth header
    const credentials = Buffer.from(`${username}:${password}`).toString('base64')

    const requestData: NetGSMSendRequest = {
      msgheader: sender,
      messages: [
        {
          msg: params.message,
          no: normalizedPhone
        }
      ],
      encoding: 'TR', // Turkish character support
      iysfilter: '0' // 0: Information SMS (no IYS check)
    }

    console.log('[NetGSM] Sending SMS to:', normalizedPhone)

    const response = await fetch(`${apiUrl}/sms/rest/v2/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify(requestData)
    })

    const data = await response.json()

    console.log('[NetGSM] Response:', data)

    // Check for success (code: "00" means success)
    if (data.code === '00' || data.code === '01' || data.code === '02') {
      return {
        success: true,
        code: data.code,
        jobid: data.jobid,
        description: data.description
      }
    } else {
      // Handle error codes
      const errorMessages: Record<string, string> = {
        '20': 'Mesaj metni hatası veya karakter sınırı aşımı',
        '30': 'Geçersiz kullanıcı adı/şifre veya IP kısıtlaması',
        '40': 'Mesaj başlığı sistemde kayıtlı değil',
        '50': 'İYS kontrollü gönderim yapılamıyor',
        '70': 'Eksik veya hatalı parametre',
        '80': 'Gönderim sınır aşımı',
        '85': 'Mükerrer gönderim sınır aşımı'
      }

      return {
        success: false,
        code: data.code,
        error: errorMessages[data.code] || `NetGSM Error: ${data.code}`
      }
    }
  } catch (error: any) {
    console.error('[NetGSM] SMS send error:', error)
    return {
      success: false,
      error: error.message || 'SMS gönderimi başarısız'
    }
  }
}

/**
 * Check SMS delivery status from NetGSM
 */
export async function checkSMSStatus(jobId: string): Promise<SMSStatusResult> {
  try {
    const username = process.env.NETGSM_USERNAME
    const password = process.env.NETGSM_PASSWORD
    const apiUrl = process.env.NETGSM_API_URL || 'https://api.netgsm.com.tr'

    if (!username || !password) {
      return {
        success: false,
        error: 'NetGSM credentials not configured'
      }
    }

    const credentials = Buffer.from(`${username}:${password}`).toString('base64')

    const requestData: NetGSMReportRequest = {
      jobids: [jobId],
      appname: 'SigortaYonetim'
    }

    const response = await fetch(`${apiUrl}/sms/rest/v2/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify(requestData)
    })

    const data = await response.json()

    if (data.response && data.response.job && data.response.job.length > 0) {
      const job = data.response.job[0]
      
      return {
        success: true,
        status: job.status,
        deliveredDate: job.deliveredDate,
        errorCode: job.errorCode,
        operator: job.operator
      }
    } else {
      return {
        success: false,
        error: 'SMS durumu sorgulanamadı'
      }
    }
  } catch (error: any) {
    console.error('[NetGSM] Status check error:', error)
    return {
      success: false,
      error: error.message || 'Durum sorgulama başarısız'
    }
  }
}

/**
 * Send bulk SMS to multiple recipients
 */
export async function sendBulkSMS(messages: Array<{ 
  phone: string
  message: string 
}>): Promise<SMSResult[]> {
  const results: SMSResult[] = []
  
  for (const msg of messages) {
    const result = await sendSMS(msg)
    results.push(result)
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return results
}

/**
 * Get SMS status description in Turkish
 */
export function getSMSStatusDescription(status: number): string {
  const statusMap: Record<number, string> = {
    0: 'İletilmeyi bekliyor',
    1: 'İletildi',
    2: 'Zaman aşımı',
    3: 'Hatalı numara',
    4: 'Operatöre gönderilemedi',
    11: 'Operatör tarafından reddedildi',
    12: 'Gönderim hatası',
    13: 'Mükerrer gönderim',
    14: 'Yetersiz kredi',
    15: 'Kara liste',
    16: 'İYS ret',
    17: 'İYS hatası'
  }
  
  return statusMap[status] || 'Bilinmeyen durum'
}

/**
 * Get operator name from operator code
 */
export function getOperatorName(operatorCode: number): string {
  const operatorMap: Record<number, string> = {
    10: 'Vodafone',
    20: 'Türk Telekom',
    30: 'Turkcell',
    40: 'Netgsm STH',
    41: 'Netgsm Mobil',
    60: 'Türktelekom Sabit',
    70: 'Tanımsız Operatör',
    160: 'KKTC Vodafone',
    880: 'KKTC Turkcell'
  }
  
  if (operatorCode >= 212 && operatorCode <= 215) {
    return 'Yurtdışı'
  }
  
  return operatorMap[operatorCode] || 'Bilinmeyen'
}

