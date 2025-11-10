'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-lg shadow-xl p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Kritik Hata
              </h1>
              
              <p className="text-gray-600 mb-6">
                Bir sistem hatası oluştu. Lütfen sayfayı yenileyin.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={reset}
                  variant="default"
                >
                  Tekrar Dene
                </Button>
                
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                >
                  Ana Sayfa
                </Button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

