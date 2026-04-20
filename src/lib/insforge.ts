import { createClient } from '@insforge/sdk'
import type { InsForgeClient } from '@insforge/sdk'

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL || ''
const INSFORGE_ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || ''

let clientInstance: InsForgeClient | null = null

export function createInsForgeClient(): InsForgeClient {
  if (typeof window !== 'undefined' && clientInstance) {
    return clientInstance
  }

  const client = createClient({
    baseUrl: INSFORGE_URL,
    anonKey: INSFORGE_ANON_KEY,
  })

  if (typeof window !== 'undefined') {
    clientInstance = client
  }

  return client
}

export function createInsForgeServerClient(accessToken?: string) {
  const serverAnonKey = process.env.INSFORGE_ANON_KEY || INSFORGE_ANON_KEY
  return createClient({
    baseUrl: INSFORGE_URL,
    anonKey: serverAnonKey,
    isServerMode: true,
    edgeFunctionToken: accessToken,
  })
}