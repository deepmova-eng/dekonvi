import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        // Vérifier que l'utilisateur est admin
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Vérifier le role admin
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError || profile?.role !== 'admin') {
            return new Response(
                JSON.stringify({ error: 'Forbidden - Admin access required' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Parse la requête
        const { action, listingId, userId, status, role, requestId } = await req.json()

        switch (action) {
            case 'approve-listing':
                const { error: approveError } = await supabase
                    .from('listings')
                    .update({ status: 'active' })
                    .eq('id', listingId)

                if (approveError) throw approveError

                return new Response(
                    JSON.stringify({ success: true, message: 'Annonce approuvée' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )

            case 'reject-listing':
                const { error: rejectError } = await supabase
                    .from('listings')
                    .update({ status: 'rejected' })
                    .eq('id', listingId)

                if (rejectError) throw rejectError

                return new Response(
                    JSON.stringify({ success: true, message: 'Annonce rejetée' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )

            case 'ban-user':
                const { error: banError } = await supabase
                    .from('profiles')
                    .update({ status: status || 'banned' })
                    .eq('id', userId)

                if (banError) throw banError

                return new Response(
                    JSON.stringify({ success: true, message: 'Statut utilisateur mis à jour' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )

            case 'toggle-admin':
                const { error: roleError } = await supabase
                    .from('profiles')
                    .update({ role: role })
                    .eq('id', userId)

                if (roleError) throw roleError

                return new Response(
                    JSON.stringify({ success: true, message: 'Rôle mis à jour' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )

            case 'approve-premium':
                const { error: premiumError } = await supabase
                    .from('premium_requests')
                    .update({ status: 'approved' })
                    .eq('id', requestId)

                if (premiumError) throw premiumError

                // Mettre à jour le listing
                const { error: updateError } = await supabase
                    .from('listings')
                    .update({ is_premium: true })
                    .eq('id', listingId)

                if (updateError) throw updateError

                return new Response(
                    JSON.stringify({ success: true, message: 'Demande Premium approuvée' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )

            case 'reject-premium':
                const { error: rejectPremiumError } = await supabase
                    .from('premium_requests')
                    .update({ status: 'rejected' })
                    .eq('id', requestId)

                if (rejectPremiumError) throw rejectPremiumError

                return new Response(
                    JSON.stringify({ success: true, message: 'Demande Premium rejetée' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )

            default:
                return new Response(
                    JSON.stringify({ error: 'Action inconnue' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
        }

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
