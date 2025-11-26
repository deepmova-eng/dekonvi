import { Heart, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useIsFavorite, useToggleFavorite } from '../../hooks/useFavorites';
import { useSupabase } from '../../contexts/SupabaseContext';
import type { Listing } from '../../types/listing';
import './ProductCard.css';

interface ProductCardProps {
    listing: Listing;
}

export default function ProductCard({ listing }: ProductCardProps) {
    const { user } = useSupabase();
    const { data: isFavorite = false } = useIsFavorite(listing.id);
    const { mutate: toggleFavorite } = useToggleFavorite();

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            // TODO: Show login modal
            return;
        }

        toggleFavorite({
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

    // Check if listing is new (< 48h)
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
        <Link to={`/listings/${listing.id}`} className="product-card">
            {/* Image container */}
            <div className="product-card__image-container">
                <img
                    src={listing.images?.[0] || '/placeholder.png'}
                    alt={listing.title}
                    className="product-card__image"
                    loading="lazy"
                />

                {/* Badges Container */}
                <div className="product-card__badges">
                    {/* Badge Premium */}
                    {((listing as any).is_premium || listing.isPremium) && (
                        <span className="product-card__badge product-card__badge--premium">
                            Premium
                        </span>
                    )}

                    {/* Badge Nouveau */}
                    {isNew() && (
                        <span className="product-card__badge product-card__badge--new">
                            Nouveau
                        </span>
                    )}

                    {/* Badge Urgent */}
                    {((listing as any).is_urgent || listing.isUrgent) && (
                        <span className="product-card__badge product-card__badge--urgent">
                            Urgent
                        </span>
                    )}
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
```
