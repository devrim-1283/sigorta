import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
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
        if (!credentials?.password) {
          throw new Error('Şifre gerekli')
        }

        // Determine login type
        let user
        if (credentials.email) {
          user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            include: {
              role: true,
              dealer: true,
            },
          })
        } else if (credentials.phone) {
          user = await prisma.user.findUnique({
            where: { phone: credentials.phone as string },
            include: {
              role: true,
              dealer: true,
            },
          })
        } else if (credentials.tc_no) {
          user = await prisma.user.findUnique({
            where: { tc_no: credentials.tc_no as string },
            include: {
              role: true,
              dealer: true,
            },
          })
        }

        if (!user) {
          throw new Error('Kullanıcı bulunamadı')
        }

        if (!user.is_active) {
          throw new Error('Hesabınız aktif değil')
        }

        // Verify password (bcrypt hash from Laravel)
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Geçersiz şifre')
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
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

