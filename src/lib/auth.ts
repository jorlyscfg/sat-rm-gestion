import { cookies } from 'next/headers'

const ACCESS_COOKIE = 'insforge_access_token'
const REFRESH_COOKIE = 'insforge_refresh_token'

const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies()
  cookieStore.set(ACCESS_COOKIE, accessToken, { ...authCookieOptions, maxAge: 60 * 60 * 24 * 7 })
  if (refreshToken) {
    cookieStore.set(REFRESH_COOKIE, refreshToken, { ...authCookieOptions, maxAge: 60 * 60 * 24 * 30 })
  } else {
    cookieStore.delete(REFRESH_COOKIE)
  }
}

export async function getAuthCookies() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value
  return { accessToken, refreshToken }
}

export async function clearAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.delete(ACCESS_COOKIE)
  cookieStore.delete(REFRESH_COOKIE)
}