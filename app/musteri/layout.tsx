import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Redirect to login if not authenticated or not customer role
  if (!session?.user || session.user.role !== 'musteri') {
    redirect('/musteri-giris')
  }

  return <>{children}</>
}

