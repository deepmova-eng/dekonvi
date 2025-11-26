
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cnnifestkyytrjhgvtrb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubmlmZXN0a3l5dHJqaGd2dHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDYyMDMsImV4cCI6MjA3OTIyMjIwM30.IKgx_P90lCP55I_V-RHAcoWdFnJRY8oNe_VnbXRohps';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    console.log('Testing listings fetch...');
    try {
        const { data, error } = await supabase
            .from('listings')
            .select('*')
            .limit(5);

        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Success! Found', data.length, 'listings');
            console.log(data);
        }
    } catch (err) {
        console.error('Exception:', err);
    }
}

test();
