import { Heart, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useIsFavorite, useToggleFavorite } from '../../hooks/useFavorites';
import { useSupabase } from '../../contexts/SupabaseContext';
import OptimizedImage from '../common/OptimizedImage';
import type { Listing } from '../../types/listing';
import './ProductListItem.css';

interface ProductListItemProps {
    listing: Listing;
}

export default function ProductListItem({ listing }: ProductListItemProps) {
    const { user } = useSupabase();
    const { data: isFavorite = false } = useIsFavorite(listing.id);
    const { mutate: toggleFavorite } = useToggleFavorite();

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
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

    const isNew = () => {
        const createdAtValue = (listing as any).created_at || listing.createdAt;
        if (!createdAtValue) return false;

        const createdAt = new Date(createdAtValue);
        const now = new Date();
        const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return diffHours < 48;
    };

    return (
        <Link to={`/listings/${listing.id}`} className="product-list-item">
            {/* Image */}
            <div className="product-list-item__image-container">
                <OptimizedImage
                    src={listing.images?.[0] || '/placeholder.png'}
                    alt={listing.title}
                    aspectRatio="4/3"
                    loading="lazy"
                />

                {/* Badges */}
                <div className="product-list-item__badges">
                    {((listing as any).is_premium || listing.isPremium) && (
                        <span className="product-list-item__badge product-list-item__badge--premium">
                            Premium
                        </span>
                    )}
                    {isNew() && (
                        <span className="product-list-item__badge product-list-item__badge--new">
                            Nouveau
                        </span>
                    )}
                    {((listing as any).is_urgent || listing.isUrgent) && (
                        <span className="product-list-item__badge product-list-item__badge--urgent">
                            Urgent
                        </span>
                    )}
                </div>

                {/* Bouton favori */}
                <button
                    onClick={handleFavoriteClick}
                    className={`product-list-item__favorite ${isFavorite ? 'active' : ''}`}
                    aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                    <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
            </div>

            {/* Contenu */}
            <div className="product-list-item__content">
                <div className="product-list-item__header">
                    <h3 className="product-list-item__title">{listing.title}</h3>
                    <p className="product-list-item__price" data-testid="product-price">
                        {listing.price.toLocaleString()} FCFA
                    </p>
                </div>

                <p className="product-list-item__description">
                    {(listing.description || '').substring(0, 150)}
                    {(listing.description || '').length > 150 ? '...' : ''}
                </p>

                <div className="product-list-item__meta">
                    <span className="product-list-item__location">
                        <MapPin size={14} />
                        {listing.location || 'Lomé'}
                    </span>
                    <span className="product-list-item__timestamp">
                        {formatTimestamp(
                            ((listing as any).created_at || listing.createdAt)?.toString() || new Date().toISOString()
                        )}
                    </span>
                </div>
            </div>
        </Link>
    );
}
