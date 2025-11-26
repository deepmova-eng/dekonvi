import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAdminAccount() {
  console.log('Checking admin account: admin@dekonvi.com');
  
  // Try to sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@dekonvi.com',
    password: 'Admin123!'
  });

  if (error) {
    console.error('❌ Login error:', error.message);
    console.error('Error details:', error);
  } else {
    console.log('✅ Login successful!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Email confirmed:', data.user.email_confirmed_at);
    
    // Sign out
    await supabase.auth.signOut();
  }
}

checkAdminAccount();
