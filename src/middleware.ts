import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logger } from './lib/logger'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('insforge_access_token')?.value

  logger.debug(`[Proxy] ${pathname}`, { hasToken: !!accessToken })

  const protectedPaths = ['/', '/gestion', '/profile']
  const authPaths = ['/auth/sign-in', '/auth/sign-up', '/auth/forgot-password']

  const isProtected = protectedPaths.some(p => p === '/' ? pathname === '/' : pathname.startsWith(p))
  const isAuthPage = authPaths.some(p => pathname.startsWith(p))

  const hasToken = !!accessToken

  if (isProtected && !hasToken) {
    logger.info(`[Proxy] Redirecting to sign-in from ${pathname}`)
    const url = request.nextUrl.clone()
    url.pathname = '/auth/sign-in'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthPage && hasToken) {
    logger.info(`[Proxy] Redirecting to home from auth page ${pathname}`)
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/gestion/:path*', '/profile/:path*', '/auth/:path*'],
}
