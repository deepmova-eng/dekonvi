/**
 * Supabase Edge Function: Expire Premium Listings
 * 
 * Purpose: Scheduled function to automatically expire premium boosts
 * Schedule: Run daily at 00:00 UTC
 * 
 * Setup in Supabase:
 * 1. Deploy: supabase functions deploy expire-premium-listings
 * 2. Schedule: Configure in Supabase Dashboard > Edge Functions
 *    - Cron expression: "0 0 * * *" (daily at midnight UTC)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    try {
        // CORS headers
        if (req.method === 'OPTIONS') {
            return new Response('ok', {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
                }
            })
        }

        // Create Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Use service role for admin operations
        const supabase = createClient(supabaseUrl, supabaseKey)

        console.log('Starting premium listings expiration check...')

        // Call the database function
        const { data, error } = await supabase
            .rpc('api_expire_premium_listings')

        if (error) {
            console.error('Error expiring premium listings:', error)
            throw error
        }

        const result = {
            success: true,
            message: 'Premium listings expiration completed',
            data: data,
            timestamp: new Date().toISOString()
        }

        console.log('Expiration result:', result)

        return new Response(
            JSON.stringify(result),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                status: 200
            }
        )

    } catch (error) {
        console.error('Function error:', error)

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                status: 500
            }
        )
    }
})
