import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { listing_id, user_id } = await req.json()

        console.log('🏆 Claim Ticker Spot request:', { listing_id, user_id })

        // Create Supabase client
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

        // 1. Verify listing exists and belongs to user
        const { data: listing, error: listingError } = await supabaseAdmin
            .from('listings')
            .select('id, title, price, seller_id, status')
            .eq('id', listing_id)
            .single()

        if (listingError || !listing) {
            throw new Error('Annonce introuvable')
        }

        if (listing.seller_id !== user_id) {
            throw new Error('Cette annonce ne vous appartient pas')
        }

        if (listing.status !== 'approved') {
            throw new Error('Cette annonce doit être approuvée pour apparaître dans le ticker')
        }

        // 2. Get ticker package (200 FCFA)
        const { data: pkg, error: pkgError } = await supabaseAdmin
            .from('boost_packages')
            .select('*')
            .eq('name', 'Ticker Star')
            .single()

        if (pkgError || !pkg) {
            throw new Error('Package Ticker introuvable')
        }

        // 3. Get previous owner (if any) for notification
        const { data: currentSpot } = await supabaseAdmin
            .from('ticker_spot')
            .select('owner_id, current_listing_id')
            .single()

        const previousOwnerId = currentSpot?.owner_id

        // 4. Create transaction
        const { data: transaction, error: txError } = await supabaseAdmin
            .from('transactions')
            .insert({
                listing_id,
                user_id,
                package_id: pkg.id,
                amount: pkg.price,
                provider: 'ticker', // Custom provider for ticker
                phone_number: '00000000', // Placeholder
                status: 'pending',
                expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
            })
            .select()
            .single()

        if (txError) {
            console.error('Transaction error:', txError)
            throw new Error('Erreur lors de la création de la transaction')
        }

        // 5. Immediately claim the spot (no payment for now - TODO: integrate PayGate)
        // For MVP, we'll just claim it directly
        const { error: updateError } = await supabaseAdmin
            .from('ticker_spot')
            .update({
                current_listing_id: listing_id,
                owner_id: user_id,
                claimed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })

        if (updateError) {
            console.error('Update error:', updateError)
            throw new Error('Erreur lors de la mise à jour du ticker')
        }

        // 6. Update transaction to success
        await supabaseAdmin
            .from('transactions')
            .update({ status: 'success' })
            .eq('id', transaction.id)

        // 7. Send notification to previous owner (if exists)
        if (previousOwnerId && previousOwnerId !== user_id) {
            // TODO: Send email notification
            console.log(`📧 Should notify user ${previousOwnerId} that they were dethroned`)

            // Create in-app notification
            await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: previousOwnerId,
                    type: 'ticker_dethroned',
                    title: '👑 Vous avez été détrôné !',
                    message: 'Quelqu\'un a pris votre place dans le ticker. Reprenez le trône pour 200 FCFA !',
                    link: '/',
                })
        }

        console.log('✅ Ticker spot claimed successfully!')

        return new Response(
            JSON.stringify({
                success: true,
                transaction_id: transaction.id,
                message: 'Ticker spot claimed!',
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Error:', error)
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
