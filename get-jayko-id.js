import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
)

async function getUserId() {
    // Search by name
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name')
        .ilike('name', '%jayko%')
        .limit(5)

    if (error) {
        console.log('Error:', error.message)
        return
    }

    if (!data || data.length === 0) {
        console.log('No users found with name containing "jayko"')
        return
    }

    console.log('Found users:')
    data.forEach(user => {
        console.log('\n---')
        console.log('User ID:', user.id)
        console.log('Email:', user.email)
        console.log('Name:', user.name)
        console.log('Local URL:', `http://localhost:5173/profile/${user.id}`)
        console.log('Production URL:', `https://dekonvi.com/profile/${user.id}`)
    })
}

getUserId()
