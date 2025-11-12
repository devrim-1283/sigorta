import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import { validateEmail, validatePhone, validateTCNo, validatePassword } from '@/lib/validation'

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: '/yonetici-giris',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
      const isOnAdmin = nextUrl.pathname.startsWith('/admin')
      const isOnAuth = nextUrl.pathname.startsWith('/auth')

      if (isOnDashboard || isOnAdmin) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      } else if (isLoggedIn && isOnAuth) {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.roleId = user.roleId
        token.dealerId = user.dealerId
        token.isActive = user.isActive
      }

      // Handle session update
      if (trigger === 'update' && session) {
        token = { ...token, ...session }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.roleId = token.roleId as number
        session.user.dealerId = token.dealerId as number | null
        session.user.isActive = token.isActive as boolean
      }
      return session
    },
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        phone: { label: 'Phone', type: 'text' },
        tc_no: { label: 'TC No', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          // Validate password first
          if (!credentials?.password) {
            throw new Error('Şifre gerekli')
          }

          const passwordValidation = validatePassword(credentials.password as string)
          if (!passwordValidation.valid) {
            throw new Error(passwordValidation.error || 'Geçersiz şifre formatı')
          }

          // Determine login type and validate input
          let user
          let identifier: string

          if (credentials.email) {
            const emailValidation = validateEmail(credentials.email as string)
            if (!emailValidation.valid) {
              throw new Error(emailValidation.error || 'Geçersiz e-posta')
            }
            identifier = emailValidation.sanitized

            user = await prisma.user.findUnique({
              where: { email: identifier },
              include: {
                role: true,
                dealer: true,
              },
            })
          } else if (credentials.phone) {
            const phoneValidation = validatePhone(credentials.phone as string)
            if (!phoneValidation.valid) {
              throw new Error(phoneValidation.error || 'Geçersiz telefon numarası')
            }
            identifier = phoneValidation.sanitized

            user = await prisma.user.findUnique({
              where: { phone: identifier },
              include: {
                role: true,
                dealer: true,
              },
            })
          } else if (credentials.tc_no) {
            const tcValidation = validateTCNo(credentials.tc_no as string)
            if (!tcValidation.valid) {
              throw new Error(tcValidation.error || 'Geçersiz TC Kimlik No')
            }
            identifier = tcValidation.sanitized

            user = await prisma.user.findUnique({
              where: { tc_no: identifier },
              include: {
                role: true,
                dealer: true,
              },
            })
          } else {
            throw new Error('E-posta, telefon veya TC Kimlik No gerekli')
          }

          if (!user) {
            throw new Error('Kullanıcı adı veya şifre hatalı')
          }

          if (!user.is_active) {
            throw new Error('Hesabınız aktif değil. Lütfen yönetici ile iletişime geçin.')
          }

          // Verify password (bcrypt hash)
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

          if (!isPasswordValid) {
            throw new Error('Kullanıcı adı veya şifre hatalı')
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { last_login_at: new Date() },
          })

          return {
            id: user.id.toString(),
            name: user.name,
            email: user.email || undefined,
            role: user.role.name,
            roleId: Number(user.role_id),
            dealerId: user.dealer_id ? Number(user.dealer_id) : null,
            isActive: user.is_active,
          }
        } catch (error) {
          // Log error for monitoring
          console.error('[Auth Error]', error)
          throw error
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1 day
    updateAge: 60 * 60, // 1 hour - refresh session every hour
  },
  secret: process.env.NEXTAUTH_SECRET,
}

