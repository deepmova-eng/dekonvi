import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
}

interface PaymentRequest {
    listing_id: string
    package_id: string
    phone_number: string
    network: 'tmoney' | 'flooz'
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        // Get user
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('Non autorisé')
        }

        // Parse request
        const { listing_id, package_id, phone_number, network }: PaymentRequest =
            await req.json()

        // Validate inputs
        if (!listing_id || !package_id || !phone_number || !network) {
            throw new Error('Paramètres manquants')
        }

        // Validate phone number (Togo format)
        const phoneRegex = /^(90|91|92|93|96|97|98|99)\d{6}$/
        if (!phoneRegex.test(phone_number)) {
            throw new Error('Numéro de téléphone invalide (format : 90XXXXXX)')
        }

        // Check listing exists and belongs to user
        const { data: listing, error: listingError } = await supabaseClient
            .from('listings')
            .select('id, seller_id')
            .eq('id', listing_id)
            .single()

        if (listingError || !listing) {
            throw new Error('Annonce introuvable')
        }

        if (listing.seller_id !== user.id) {
            throw new Error('Cette annonce ne vous appartient pas')
        }

        // Get package details
        const { data: pkg, error: packageError } = await supabaseClient
            .from('boost_packages')
            .select('*')
            .eq('id', package_id)
            .eq('active', true)
            .single()

        if (packageError || !pkg) {
            throw new Error('Package introuvable')
        }

        // Create transaction record (pending)
        const { data: transaction, error: transactionError } = await supabaseClient
            .from('transactions')
            .insert({
                listing_id,
                user_id: user.id,
                package_id,
                amount: pkg.price,
                provider: network,
                phone_number,
                status: 'pending',
                expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 minutes
            })
            .select()
            .single()

        if (transactionError || !transaction) {
            throw new Error('Erreur lors de la création de la transaction')
        }

        // Call PayGate API (using official documentation format)
        const paygateApiKey = Deno.env.get('PAYGATE_API_KEY')

        if (!paygateApiKey) {
            throw new Error('Configuration PayGate manquante')
        }

        // PayGate expects auth_token in body, not as Bearer header
        // URL is https://paygateglobal.com/api/v1/pay (not api.paygateglobal.com)
        const paygateResponse = await fetch('https://paygateglobal.com/api/v1/pay', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                auth_token: paygateApiKey,
                phone_number: phone_number,
                amount: pkg.price,
                identifier: transaction.id, // Unique identifier required by PayGate
                network: network === 'tmoney' ? 'TMONEY' : 'FLOOZ',
                description: `Boost ${pkg.name} - Dekonvi`,
            }),
        })

        if (!paygateResponse.ok) {
            const errorData = await paygateResponse.text()
            console.error('PayGate API Error:', errorData)

            // Update transaction status to failed
            await supabaseClient
                .from('transactions')
                .update({
                    status: 'failed',
                    error_message: `PayGate API Error: ${errorData}`,
                })
                .eq('id', transaction.id)

            throw new Error('Erreur lors de l\'initialisation du paiement')
        }

        const paygateData = await paygateResponse.json()

        // PayGate returns: { tx_reference, status }
        // status = 0: Success, 2: Invalid token, 4: Invalid params, 6: Duplicate
        if (paygateData.status !== 0) {
            const errorMessages: Record<number, string> = {
                2: 'Jeton d\'authentification invalide',
                4: 'Paramètres invalides',
                6: 'Transaction déjà existante',
            }
            const errorMsg = errorMessages[paygateData.status] || 'Erreur inconnue'

            await supabaseClient
                .from('transactions')
                .update({
                    status: 'failed',
                    error_message: errorMsg,
                })
                .eq('id', transaction.id)

            throw new Error(errorMsg)
        }

        // Update transaction with PayGate reference
        const { error: updateError } = await supabaseClient
            .from('transactions')
            .update({
                paygate_ref: paygateData.tx_reference || paygateData.reference,
            })
            .eq('id', transaction.id)

        if (updateError) {
            console.error('Error updating transaction with PayGate ref:', updateError)
        }

        // Return success response
        return new Response(
            JSON.stringify({
                success: true,
                tx_reference: paygateData.tx_reference || paygateData.reference,
                transaction_id: transaction.id,
                expires_at: transaction.expires_at,
                amount: pkg.price,
                message: 'Paiement initié. Veuillez valider sur votre téléphone.',
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Error in initiate-payment:', error)
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
