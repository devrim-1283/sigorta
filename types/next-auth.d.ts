import 'next-auth'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      roleId: number
      dealerId: number | null
      isActive: boolean
    } & DefaultSession['user']
  }

  interface User {
    role: string
    roleId: number
    dealerId: number | null
    isActive: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    roleId: number
    dealerId: number | null
    isActive: boolean
  }
}

