import { Heart, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import { useIsFavorite, useToggleFavorite } from '../../hooks/useFavorites';
import { useSupabase } from '../../contexts/SupabaseContext';
import { supabase } from '../../lib/supabase';
import OptimizedImage from '../common/OptimizedImage';
import type { Listing } from '../../types/listing';
import './ProductCard.css';

interface ProductCardProps {
    listing: Listing;
}

export default function ProductCard({ listing }: ProductCardProps) {
    const { user } = useSupabase();
    const queryClient = useQueryClient();
    const { data: isFavorite = false } = useIsFavorite(listing.id);
    const { mutate: toggleFavorite } = useToggleFavorite();

    // ⚡ Prefetch au hover pour navigation instantanée
    const handleMouseEnter = () => {
        // Prefetch listing details
        queryClient.prefetchQuery({
            queryKey: ['listing', listing.id],
            queryFn: async () => {
                const { data, error } = await supabase
                    .from('listings')
                    .select('*')
                    .eq('id', listing.id)
                    .single();

                if (error) throw error;
                return data;
            },
            staleTime: 1000 * 60 * 5, // 5 minutes
        });

        // Prefetch seller profile
        const sellerId = (listing as any).seller_id || listing.sellerId;
        if (sellerId) {
            queryClient.prefetchQuery({
                queryKey: ['seller-profile', sellerId],
                queryFn: async () => {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', sellerId)
                        .single();

                    if (error) throw error;
                    return data;
                },
                staleTime: 1000 * 60 * 10, // 10 minutes
            });
        }
    };

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            // TODO: Show login modal
            return;
        }

        toggleFavorite({
            userId: user.id,
            listingId: listing.id,
            isFavorite: !!isFavorite,
        });
    };

    const formatTimestamp = (date: string) => {
        try {
            return formatDistanceToNow(new Date(date), {
                addSuffix: true,
                locale: fr,
            });
        } catch {
            return 'Récemment';
        }
    };

    // Check if listing is new (<48h)
    const isNew = () => {
        // Handle both camelCase and snake_case
        const createdAtValue = (listing as any).created_at || listing.createdAt;
        if (!createdAtValue) return false;

        const createdAt = new Date(createdAtValue);
        const now = new Date();
        const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return diffHours < 48;
    };

    return (
        <Link
            to={`/listings/${listing.id}`}
            className="product-card"
            onMouseEnter={handleMouseEnter}
        >
            {/* Image container */}
            <div className="product-card__image-container">
                <OptimizedImage
                    src={listing.images?.[0] || '/placeholder.png'}
                    alt={listing.title}
                    className="product-card__image"
                    loading="lazy"
                />

                {/* Badges Container - Left and Right positioning */}
                <div className="product-card__badges">
                    {/* Left side - Premium */}
                    <div>
                        {((listing as any).is_premium || listing.isPremium) && (
                            <span className="product-card__badge product-card__badge--premium">
                                Premium
                            </span>
                        )}
                    </div>

                    {/* Right side - Nouveau */}
                    <div>
                        {isNew() && (
                            <span className="product-card__badge product-card__badge--new">
                                Nouveau
                            </span>
                        )}
                    </div>
                </div>

                {/* Bouton favori */}
                <button
                    onClick={handleFavoriteClick}
                    className={`product-card__favorite ${isFavorite ? 'active' : ''}`}
                    aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                    <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
            </div>

            {/* Contenu */}
            <div className="product-card__content">
                {/* Titre */}
                <h3 className="product-card__title">{listing.title}</h3>

                {/* Prix */}
                <p className="product-card__price" data-testid="product-price">
                    {listing.price.toLocaleString()} FCFA
                </p>

                {/* Meta infos */}
                <div className="product-card__meta">
                    <span className="product-card__location">
                        <MapPin size={12} />
                        {listing.location || 'Lomé'}
                    </span>
                    <span className="product-card__timestamp">
                        {formatTimestamp(
                            ((listing as any).created_at || listing.createdAt)?.toString() || new Date().toISOString()
                        )}
                    </span>
                </div>
            </div>
        </Link>
    );
}
