import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
)

async function getAdminId() {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name')
        .eq('email', 'admin@dekonvi.com')
        .single()

    if (error) {
        console.log('Error:', error.message)
        return
    }

    console.log('Admin User ID:', data.id)
    console.log('Email:', data.email)
    console.log('Name:', data.name)
    console.log('\nProfile URL:', `http://localhost:5173/profile/${data.id}`)
    console.log('Production URL:', `https://dekonvi.com/profile/${data.id}`)
}

getAdminId()
