import { getAssets } from './src/app/actions/assets'

async function test() {
  console.log('Testing getAssets...')
  const res = await getAssets()
  if (res.error) {
    console.error('Error:', res.error)
  } else {
    console.log('Count:', res.data?.length)
    console.log('Data:', JSON.stringify(res.data, null, 2))
  }
}

test()
