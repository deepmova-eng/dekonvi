import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabase } from './SupabaseContext';
import toast from 'react-hot-toast';

interface FavoritesContextType {
    favorites: Set<string>;
    loading: boolean;
    isFavorite: (listingId: string) => boolean;
    toggleFavorite: (listingId: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const { user } = useSupabase();
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    // Fetch favorites on mount or when user changes
    useEffect(() => {
        if (!user) {
            setFavorites(new Set());
            setLoading(false);
            return;
        }

        const fetchFavorites = async () => {
            try {
                const { data, error } = await supabase
                    .from('favorites')
                    .select('listing_id')
                    .eq('user_id', user.id);

                if (error) throw error;

                setFavorites(new Set(data?.map(f => f.listing_id) || []));
            } catch (error) {
                console.error('Error fetching favorites:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();

        // Subscribe to changes
        const channel = supabase
            .channel('favorites_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'favorites',
                    filter: `user_id=eq.${user.id}`
                },
                () => {
                    fetchFavorites();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const isFavorite = useCallback((listingId: string) => {
        return favorites.has(listingId);
    }, [favorites]);

    const toggleFavorite = async (listingId: string) => {
        if (!user) {
            toast.error('Veuillez vous connecter pour ajouter aux favoris');
            return;
        }

        // Optimistic update
        const isFav = favorites.has(listingId);
        const newFavorites = new Set(favorites);
        if (isFav) {
            newFavorites.delete(listingId);
        } else {
            newFavorites.add(listingId);
        }
        setFavorites(newFavorites);

        try {
            if (isFav) {
                const { error } = await supabase
                    .from('favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('listing_id', listingId);

                if (error) throw error;
                toast.success('Retiré des favoris');
            } else {
                const { error } = await supabase
                    .from('favorites')
                    .insert({
                        user_id: user.id,
                        listing_id: listingId
                    });

                if (error) throw error;
                toast.success('Ajouté aux favoris');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            toast.error('Erreur lors de la mise à jour des favoris');
            // Revert optimistic update
            setFavorites(favorites);
        }
    };

    return (
        <FavoritesContext.Provider value={{ favorites, loading, isFavorite, toggleFavorite }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavoritesContext() {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavoritesContext must be used within a FavoritesProvider');
    }
    return context;
}
