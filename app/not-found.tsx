import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-blue-100 p-3">
              <FileQuestion className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold text-gray-900 mb-2">
            404
          </h1>
          
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Sayfa Bulunamadı
          </h2>
          
          <p className="text-gray-600 mb-6">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </p>
          
          <Link href="/">
            <Button variant="default">
              Ana Sayfaya Dön
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

