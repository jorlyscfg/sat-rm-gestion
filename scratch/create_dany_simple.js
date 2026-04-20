async function run() {
  const url = 'https://5gdhjr6i.us-east.insforge.app/api/auth/users'
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzM4Mjh9.b6rpZd9vdBPU5Q106Oh5nqL1-fiQZ1BhiEDCjT-9ZSA'

  console.log('Creando usuario dany@gmail.com...')
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`
    },
    body: JSON.stringify({
      email: 'dany@gmail.com',
      password: 'day2026',
      name: 'Dany',
      organization_name: 'SATS-RM'
    })
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('Error al crear usuario:', data)
    process.exit(1)
  }

  console.log('Usuario creado con éxito:', data)
}

run()
