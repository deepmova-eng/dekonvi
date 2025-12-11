import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
}

/**
 * Check Payment Status - Polling Fallback for PayGate Webhook
 * 
 * This function checks the status of a pending transaction on PayGate API
 * when the webhook doesn't arrive (fallback mechanism)
 * 
 * Called by BoostModal after countdown expiration if status still pending
 */

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { transaction_id } = await req.json()

        console.log('🔍 Check Payment Status - transaction:', transaction_id)

        if (!transaction_id) {
            throw new Error('transaction_id requis')
        }

        // Create Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

        const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        })

        // Get transaction
        const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .select('*, boost_packages(*)')
            .eq('id', transaction_id)
            .single()

        if (txError || !transaction) {
            throw new Error('Transaction introuvable')
        }

        console.log('📋 Transaction found:', {
            id: transaction.id,
            status: transaction.status,
            paygate_ref: transaction.paygate_ref,
        })

        // If already processed, return current status
        if (transaction.status !== 'pending') {
            console.log('✅ Transaction already processed:', transaction.status)
            return new Response(
                JSON.stringify({
                    status: transaction.status,
                    message: 'Transaction déjà traitée',
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Check if expired
        if (new Date(transaction.expires_at) < new Date()) {
            console.log('⏰ Transaction expired')

            await supabase
                .from('transactions')
                .update({ status: 'expired' })
                .eq('id', transaction_id)

            return new Response(
                JSON.stringify({
                    status: 'expired',
                    message: 'Transaction expirée',
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Call PayGate API to check status
        const paygateApiKey = Deno.env.get('PAYGATE_API_KEY')

        if (!paygateApiKey) {
            throw new Error('PAYGATE_API_KEY manquant')
        }

        console.log('📞 Calling PayGate API to check status...')

        // Use PayGate v2/status API (with identifier - our transaction ID)
        const paygateResponse = await fetch('https://paygateglobal.com/api/v2/status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                auth_token: paygateApiKey,
                identifier: transaction.id, // Our transaction ID used as identifier
            }),
        })

        if (!paygateResponse.ok) {
            const errorText = await paygateResponse.text()
            console.error('❌ PayGate API Error:', errorText)
            throw new Error('Erreur PayGate API')
        }

        const paygateData = await paygateResponse.json()
        console.log('📦 PayGate Response:', paygateData)

        // PayGate status codes:
        // 0: Payment successful
        // 2: In progress
        // 4: Expired
        // 6: Cancelled

        let newStatus = 'pending'
        let shouldBoost = false

        if (paygateData.status === 0) {
            newStatus = 'success'
            shouldBoost = true
            console.log('✅ Payment confirmed by PayGate!')
        } else if (paygateData.status === 4) {
            newStatus = 'expired'
            console.log('⏰ Payment expired on PayGate')
        } else if (paygateData.status === 6) {
            newStatus = 'cancelled'
            console.log('❌ Payment cancelled on PayGate')
        } else {
            console.log('⏳ Payment still pending on PayGate')
        }

        // Update transaction
        if (newStatus !== 'pending') {
            await supabase
                .from('transactions')
                .update({
                    status: newStatus,
                    paygate_ref: paygateData.tx_reference || null,
                })
                .eq('id', transaction_id)
        }

        // Boost listing if successful
        if (shouldBoost) {
            const boostDurationDays = transaction.boost_packages?.duration_days || 1
            const premiumUntil = new Date(Date.now() + boostDurationDays * 24 * 60 * 60 * 1000)

            const { error: listingError } = await supabase
                .from('listings')
                .update({
                    is_premium: true,
                    premium_until: premiumUntil.toISOString(),
                })
                .eq('id', transaction.listing_id)

            if (listingError) {
                console.error('❌ Error boosting listing:', listingError)
            } else {
                console.log(`🚀 Listing ${transaction.listing_id} boosted until ${premiumUntil}`)
            }
        }

        return new Response(
            JSON.stringify({
                status: newStatus,
                message: newStatus === 'success' ? 'Paiement confirmé !' : 'Status mis à jour',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('❌ Error in check-payment-status:', error)
        return new Response(
            JSON.stringify({
                error: error.message || 'Erreur inconnue',
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
