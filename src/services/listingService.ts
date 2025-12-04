import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

export type Condition = 'neuf' | 'comme-neuf' | 'bon-etat' | 'etat-correct' | 'a-renover';

export interface CreateListingData {
    title: string
    description: string
    price: number
    category: string
    subcategory?: string
    images: string[]
    location: string
    condition: Condition
    delivery_available?: boolean
}

export class ListingService {
    /**
     * Crée une nouvelle annonce via l'Edge Function sécurisée
     */
    static async create(data: CreateListingData) {
        try {
            // Validation côté client basique (UX rapide)
            this.validateClientSide(data)

            // Récupérer le token
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                throw new Error('Vous devez être connecté pour créer une annonce')
            }

            // Appeler l'Edge Function (validation serveur)
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-listing`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                }
            )

            const result = await response.json()

            if (!response.ok) {
                if (result.details) {
                    // Erreurs de validation multiples
                    const errorMessages = result.details
                        .map((err: any) => `${err.field}: ${err.message}`)
                        .join('\n')
                    throw new Error(errorMessages)
                }
                throw new Error(result.message || result.error || 'Erreur lors de la création')
            }

            return result.listing

        } catch (error) {
            console.error('Error in ListingService.create:', error)
            throw error
        }
    }

    /**
     * Validation côté client (pour feedback UX immédiat)
     */
    private static validateClientSide(data: CreateListingData) {
        if (!data.title || data.title.trim().length < 5) {
            throw new Error('Le titre doit contenir au moins 5 caractères')
        }

        if (!data.description || data.description.trim().length < 20) {
            throw new Error('La description doit contenir au moins 20 caractères')
        }

        if (data.price === undefined || data.price < 0) {
            throw new Error('Le prix doit être positif')
        }

        if (!data.images || data.images.length === 0) {
            throw new Error('Au moins une photo est requise')
        }

        if (data.images.length > 10) {
            throw new Error('Maximum 10 photos autorisées')
        }

        if (!data.location || data.location.trim().length < 2) {
            throw new Error('La localisation est requise')
        }

        if (!data.category) {
            throw new Error('La catégorie est requise')
        }

        if (!data.condition) {
            throw new Error('L\'état de l\'article est requis')
        }
    }

    /**
     * Met à jour une annonce existante
     * Note: Les modifications significatives déclenchent automatiquement une re-modération (statut pending)
     */
    static async update(id: string, updates: Partial<CreateListingData>) {
        try {
            const { data, error } = await supabase
                .from('listings')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) {
                throw error
            }

            // Informer l'utilisateur que l'annonce passera en modération
            toast('Votre annonce sera re-validée par un administrateur avant d\'être publiée.', {
                duration: 5000,
                icon: '⏳'
            })

            return data

        } catch (error) {
            console.error('Error updating listing:', error)
            throw error
        }
    }

    /**
     * Supprime une annonce
     */
    static async delete(id: string) {
        try {
            const { error } = await supabase
                .from('listings')
                .delete()
                .eq('id', id)

            if (error) {
                throw error
            }

        } catch (error) {
            console.error('Error deleting listing:', error)
            throw error
        }
    }
}
