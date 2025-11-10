'use server'

import prisma from '@/lib/db'
import { requireAuth } from './auth'

export async function getFileTypes() {
  await requireAuth()

  const fileTypes = await prisma.fileType.findMany({
    orderBy: { name: 'asc' },
  })

  return fileTypes.map(ft => ({
    ...ft,
    id: Number(ft.id),
  }))
}

