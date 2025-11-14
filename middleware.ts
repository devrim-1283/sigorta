import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const authMiddleware = NextAuth(authConfig).auth

export default function middleware(request: NextRequest) {
  // HTTPS enforcement in production (disabled for Coolify reverse proxy)
  // Coolify proxy handles HTTPS termination
  
  // Run NextAuth middleware
  return authMiddleware(request)
}

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}

