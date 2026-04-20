import { createClient } from '@insforge/sdk'
import 'dotenv/config'

async function run() {
  const insforge = createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY
  })

  console.log('Creando usuario dany@gmail.com...')
  
  const { data, error } = await insforge.auth.signUp({
    email: 'dany@gmail.com',
    password: 'day2026',
    name: 'Dany',
    // We cast to any because the TypeScript types might not include organization_name,
    // but the backend (and our trigger) will receive it.
    organization_name: 'SATS-RM'
  } as any)

  if (error) {
    console.error('Error al crear usuario:', error)
    process.exit(1)
  }

  console.log('Usuario creado con éxito:', data)
}

run()
