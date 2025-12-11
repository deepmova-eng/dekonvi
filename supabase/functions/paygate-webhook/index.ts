import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
}

interface PayGateWebhookPayload {
    tx_reference: string
    status: 'success' | 'failed' | 'pending'
    amount: number
    phone: string
    network?: string
}

serve(async (req) => {
    // 🔔 WEBHOOK CALLED - Log everything for debugging
    console.log('🔔 ========== PAYGATE WEBHOOK CALLED ==========')
    console.log('📅 Timestamp:', new Date().toISOString())
    console.log('🌐 Method:', req.method)
    console.log('📍 URL:', req.url)

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        console.log('✅ CORS Preflight - returning OK')
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Log all headers
        const headers: Record<string, string> = {}
        req.headers.forEach((value, key) => {
            headers[key] = value
        })
        console.log('📨 Headers:', JSON.stringify(headers, null, 2))

        // Parse webhook payload
        const rawBody = await req.text()
        console.log('📦 Raw Body:', rawBody)

        let payload: PayGateWebhookPayload
        try {
            payload = JSON.parse(rawBody)
            console.log('✅ Parsed Payload:', JSON.stringify(payload, null, 2))
        } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError)
            throw new Error('Invalid JSON payload')
        }

        // TODO: Verify webhook signature (PayGate security)
        // const signature = req.headers.get('X-PayGate-Signature')
        // if (!verifySignature(payload, signature)) {
        //   throw new Error('Invalid webhook signature')
        // }

        // Create Supabase admin client (service role)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        )

        // Find transaction by PayGate ref
        const { data: transaction, error: transactionError } = await supabaseAdmin
            .from('transactions')
            .select('*, boost_packages(*)')
            .eq('paygate_ref', payload.tx_reference)
            .single()

        if (transactionError || !transaction) {
            console.error('Transaction not found:', payload.tx_reference)
            throw new Error('Transaction introuvable')
        }

        // Check if transaction is not already processed
        if (transaction.status !== 'pending') {
            console.log('Transaction already processed:', transaction.id, transaction.status)
            return new Response(
                JSON.stringify({ message: 'Transaction already processed' }),
                { headers: corsHeaders, status: 200 }
            )
        }

        // Check if transaction has expired
        if (new Date(transaction.expires_at) < new Date()) {
            console.log('Transaction expired:', transaction.id)
            await supabaseAdmin
                .from('transactions')
                .update({ status: 'expired' })
                .eq('id', transaction.id)

            throw new Error('Transaction expirée')
        }

        // Update transaction status
        const newStatus = payload.status === 'success' ? 'success' : 'failed'

        const { error: updateError } = await supabaseAdmin
            .from('transactions')
            .update({
                status: newStatus,
                error_message: payload.status === 'failed' ? 'Paiement refusé ou annulé' : null,
            })
            .eq('id', transaction.id)

        if (updateError) {
            console.error('Error updating transaction:', updateError)
            throw new Error('Erreur lors de la mise à jour de la transaction')
        }

        // If payment success, apply boost or update ticker based on package type
        if (payload.status === 'success') {
            const packageName = transaction.boost_packages?.name
            const durationDays = transaction.boost_packages?.duration_days || 0

            console.log(`✅ Payment SUCCESS - Package: ${packageName}, Duration: ${durationDays} days`)

            // CASE 1: Ticker Star (detect by name only - duration_days is 1 in DB, not 0!)
            if (packageName === 'Ticker Star') {
                console.log('🎯 TICKER STAR detected - Updating ticker spot...')

                // Call SQL function to update ticker spot
                const { error: tickerError } = await supabaseAdmin
                    .rpc('update_ticker_spot', {
                        p_listing_id: transaction.listing_id,
                        p_owner_id: transaction.user_id
                    })

                if (tickerError) {
                    console.error('❌ Error updating ticker:', tickerError)
                    // Don't throw - transaction is still marked success
                } else {
                    console.log(`👑 Ticker updated with listing ${transaction.listing_id}`)
                }
            }
            // CASE 2: Regular Boost (all other packages)
            else {
                console.log('⚡ REGULAR BOOST detected - Boosting listing...')

                const premiumUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)

                const { error: listingError } = await supabaseAdmin
                    .from('listings')
                    .update({
                        is_premium: true,
                        premium_until: premiumUntil.toISOString(),
                    })
                    .eq('id', transaction.listing_id)

                if (listingError) {
                    console.error('❌ Error boosting listing:', listingError)
                    // Don't throw here - transaction is still marked as success
                } else {
                    console.log(`⬆️ Listing ${transaction.listing_id} boosted until ${premiumUntil}`)
                }
            }

            // TODO: Send notification to user
            // await sendNotification(transaction.user_id, {
            //   title: packageName === 'Ticker Star' ? 'Ticker Star activé !' : 'Annonce boostée !',
            //   body: packageName === 'Ticker Star' 
            //     ? 'Votre annonce est maintenant affichée dans le ticker !'
            //     : `Votre annonce est maintenant en vedette pour ${durationDays} jours.`,
            // })
        }

        return new Response(
            JSON.stringify({
                success: true,
                transaction_id: transaction.id,
                status: newStatus,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Error in paygate-webhook:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Une erreur est survenue',
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
