import { NextResponse } from 'next/server'
import { setAuthCookies, clearAuthCookies } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { accessToken, refreshToken } = body

    if (!accessToken) {
      logger.warn('[API/Set-Cookies] Missing access token in request body')
      return NextResponse.json({ error: 'Missing access token' }, { status: 400 })
    }

    await setAuthCookies(accessToken, refreshToken || '')
    logger.info('[API/Set-Cookies] Auth cookies set successfully')
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('[API/Set-Cookies] Error setting auth cookies', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE() {
  await clearAuthCookies()
  logger.info('[API/Set-Cookies] Auth cookies cleared')
  return NextResponse.json({ success: true })
}