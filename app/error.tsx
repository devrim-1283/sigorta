'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Bir Hata Oluştu
          </h1>
          
          <p className="text-gray-600 mb-6">
            Üzgünüz, bir şeyler yanlış gitti. Lütfen tekrar deneyin.
          </p>
          
          {error.message && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-6">
              <p className="text-sm text-red-800 font-mono">
                {error.message}
              </p>
            </div>
          )}
          
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
  )
}

