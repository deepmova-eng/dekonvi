const supabaseUrl = 'https://cnnifestkyytrjhgvtrb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubmlmZXN0a3l5dHJqaGd2dHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDYyMDMsImV4cCI6MjA3OTIyMjIwM30.IKgx_P90lCP55I_V-RHAcoWdFnJRY8oNe_VnbXRohps';

console.log('Testing REST API authentication...\n');

const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: {
    'apikey': supabaseAnonKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@dekonvi.com',
    password: 'Admin123!'
  })
});

console.log('Response status:', response.status);

if (response.ok) {
  const data = await response.json();
  console.log('\n✅ Login successful!');
  console.log('Access token:', data.access_token ? 'Present' : 'Missing');
  console.log('Refresh token:', data.refresh_token ? 'Present' : 'Missing');
  console.log('User:', data.user?.email);
} else {
  const errorData = await response.json();
  console.log('\n❌ Login failed!');
  console.log('Error:', errorData);
}
