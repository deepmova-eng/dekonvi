import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Types de validation
interface ValidationError {
    field: string
    message: string
}

interface CreateListingData {
    title: string
    description: string
    price: number
    category: string
    images: string[]
    location: string
    condition: string
    delivery_available?: boolean
}

// Catégories valides
const VALID_CATEGORIES = [
    'immobilier', 'vehicules', 'high-tech', 'maison', 'mode',
    'loisirs', 'famille', 'animaux', 'emploi-services',
    'materiel-pro', 'vacances', 'autres'
]

// Conditions valides
const VALID_CONDITIONS = [
    'neuf', 'comme-neuf', 'bon-etat', 'etat-correct', 'a-renover'
]

// Fonction de validation
function validateListing(data: CreateListingData): ValidationError[] {
    const errors: ValidationError[] = []

    // Titre
    if (!data.title || data.title.trim().length === 0) {
        errors.push({ field: 'title', message: 'Le titre est requis' })
    } else if (data.title.length < 5) {
        errors.push({ field: 'title', message: 'Le titre doit contenir au moins 5 caractères' })
    } else if (data.title.length > 100) {
        errors.push({ field: 'title', message: 'Le titre ne peut pas dépasser 100 caractères' })
    }

    // Description
    if (!data.description || data.description.trim().length === 0) {
        errors.push({ field: 'description', message: 'La description est requise' })
    } else if (data.description.length < 20) {
        errors.push({ field: 'description', message: 'La description doit contenir au moins 20 caractères' })
    } else if (data.description.length > 2000) {
        errors.push({ field: 'description', message: 'La description ne peut pas dépasser 2000 caractères' })
    }

    // Prix
    if (data.price === undefined || data.price === null) {
        errors.push({ field: 'price', message: 'Le prix est requis' })
    } else if (data.price < 0) {
        errors.push({ field: 'price', message: 'Le prix doit être positif' })
    } else if (data.price > 999999999) {
        errors.push({ field: 'price', message: 'Le prix est trop élevé' })
    }

    // Catégorie
    if (!data.category) {
        errors.push({ field: 'category', message: 'La catégorie est requise' })
    } else if (!VALID_CATEGORIES.includes(data.category)) {
        errors.push({ field: 'category', message: 'Catégorie invalide' })
    }

    // Images
    if (!data.images || data.images.length === 0) {
        errors.push({ field: 'images', message: 'Au moins une photo est requise' })
    } else if (data.images.length > 10) {
        errors.push({ field: 'images', message: 'Maximum 10 photos autorisées' })
    }

    // Localisation
    if (!data.location || data.location.trim().length === 0) {
        errors.push({ field: 'location', message: 'La localisation est requise' })
    } else if (data.location.length < 2 || data.location.length > 100) {
        errors.push({ field: 'location', message: 'La localisation doit contenir entre 2 et 100 caractères' })
    }

    // Condition
    if (!data.condition) {
        errors.push({ field: 'condition', message: 'L\'état est requis' })
    } else if (!VALID_CONDITIONS.includes(data.condition)) {
        errors.push({ field: 'condition', message: 'État invalide' })
    }

    return errors
}

serve(async (req) => {
    // CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Init Supabase client
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        // Vérifier l'authentification
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized', message: 'Vous devez être connecté' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Parser le body
        const body = await req.json()

        // Validation
        const validationErrors = validateListing(body)

        if (validationErrors.length > 0) {
            return new Response(
                JSON.stringify({
                    error: 'Validation failed',
                    details: validationErrors
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Vérifier la limite d'annonces (50 max par utilisateur)
        const { count, error: countError } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', user.id)
            .neq('status', 'rejected')

        if (countError) {
            throw countError
        }

        if (count && count >= 50) {
            return new Response(
                JSON.stringify({
                    error: 'Limit exceeded',
                    message: 'Vous avez atteint la limite de 50 annonces actives. Supprimez des annonces avant d\'en créer de nouvelles.'
                }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Créer l'annonce
        const { data, error } = await supabase
            .from('listings')
            .insert({
                title: body.title.trim(),
                description: body.description.trim(),
                price: body.price,
                category: body.category,
                images: body.images,
                location: body.location.trim(),
                condition: body.condition,
                delivery_available: body.delivery_available || false,
                seller_id: user.id,
                status: 'pending', // Toutes les annonces commencent en pending
            })
            .select()
            .single()

        if (error) {
            throw error
        }

        return new Response(
            JSON.stringify({
                success: true,
                listing: data,
                message: 'Annonce créée avec succès. Elle sera visible après validation par un administrateur.'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error creating listing:', error)

        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                message: error.message || 'Une erreur est survenue lors de la création de l\'annonce'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
