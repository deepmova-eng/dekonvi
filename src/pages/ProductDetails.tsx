import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  MapPin,
  Truck,
  Shield,
  MessageCircle,
  Phone,
  ArrowLeft
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useProduct } from '../hooks/useProduct';
import { useIsFavorite, useToggleFavorite } from '../hooks/useFavorites';
import { useSupabase } from '../contexts/SupabaseContext';
import './ProductDetails.css';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSupabase();
  const { product: listing, loading: isLoading, error } = useProduct(id!);
  const { data: isFavorite = false } = useIsFavorite(id!);
  const { mutate: toggleFavorite } = useToggleFavorite();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleFavoriteClick = () => {
    if (!user) {
      // TODO: Show login modal
      return;
    }

    toggleFavorite({
      listingId: id!,
      isFavorite: !!isFavorite,
    });
  };

  if (isLoading) {
    return (
      <div className="product-details-page">
        <div className="container">
          <div className="loading-state">Chargement...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-details-page">
        <div className="container">
          <div className="error-state">Erreur: {error}</div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="product-details-page">
        <div className="container">
          <div className="error-state">Annonce introuvable</div>
        </div>
      </div>
    );
  }

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? listing.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) =>
      prev === listing.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleSendMessage = async () => {
    if (!user) {
      // TODO: Show login modal
      alert('Veuillez vous connecter pour envoyer un message');
      navigate('/login');
      return;
    }

    if (user.id === listing.seller_id) {
      alert('Vous ne pouvez pas envoyer un message à vous-même');
      return;
    }

    try {
      // Import supabase
      const { supabase } = await import('../lib/supabase');

      // Vérifier si une conversation existe déjà
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${listing.seller_id}),and(user1_id.eq.${listing.seller_id},user2_id.eq.${user.id})`)
        .single();

      if (existingConv) {
        // Conversation existe, rediriger
        navigate(`/messages`);
      } else {
        // Créer nouvelle conversation
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            user1_id: user.id,
            user2_id: listing.seller_id,
            listing_id: listing.id,
          })
          .select()
          .single();

        if (error) throw error;

        navigate(`/messages`);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Erreur lors de la création de la conversation');
    }
  };

  return (
    <div className="product-details-page">
      <div className="container">

        {/* Back button */}
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft size={20} />
          Retour
        </button>

        {/* Layout 2 colonnes */}
        <div className="product-layout">

          {/* GAUCHE : Galerie */}
          <div className="product-gallery">
            <div className="gallery-main">
              <img
                src={listing.images?.[selectedImageIndex] || '/placeholder.png'}
                alt={listing.title}
                className="gallery-main-image"
              />

              {listing.images && listing.images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="gallery-nav gallery-nav--prev"
                    aria-label="Image précédente"
                  >
                    <ChevronLeft size={24} />
                  </button>

                  <button
                    onClick={handleNextImage}
                    className="gallery-nav gallery-nav--next"
                    aria-label="Image suivante"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {listing.images && listing.images.length > 1 && (
              <div className="gallery-thumbnails">
                {listing.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`gallery-thumbnail ${index === selectedImageIndex ? 'active' : ''
                      }`}
                  >
                    <img src={image} alt={`Photo ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DROITE : Infos + Actions */}
          <div className="product-sidebar">
            <div className="sidebar-sticky">

              {/* Prix */}
              <div className="product-price-section">
                <h1 className="product-price-large">
                  {listing.price.toLocaleString()} FCFA
                </h1>
                {listing.condition && (
                  <span className="product-condition-badge">
                    {listing.condition === 'new' ? 'Neuf' : 'Occasion'}
                  </span>
                )}
              </div>

              {/* Titre */}
              <h2 className="product-title-main">{listing.title}</h2>

              {/* Localisation + Date */}
              <div className="product-meta-info">
                <span className="meta-location">
                  <MapPin size={16} />
                  {listing.location || listing.city || 'Lomé'}
                </span>
                <span className="meta-timestamp">
                  {formatDistanceToNow(new Date(listing.created_at), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
              </div>

              {/* Actions principales */}
              <div className="product-actions">
                <button
                  className="btn btn--primary btn--large"
                  onClick={handleSendMessage}
                >
                  <MessageCircle size={20} />
                  Envoyer un message
                </button>

                {listing.contact_phone && !listing.hide_phone && (
                  <button className="btn btn--secondary btn--large">
                    <Phone size={20} />
                    {listing.contact_phone}
                  </button>
                )}

                <div className="product-actions-secondary">
                  <button
                    onClick={handleFavoriteClick}
                    className={`btn btn--icon ${isFavorite ? 'active' : ''}`}
                    aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <button className="btn btn--icon" aria-label="Partager">
                    <Share2 size={20} />
                  </button>
                </div>
              </div>

              {/* Info livraison */}
              {listing.delivery_available && (
                <div className="info-box">
                  <Truck size={20} />
                  <span>Livraison possible</span>
                </div>
              )}

              {/* Localisation détaillée */}
              <div className="info-box">
                <MapPin size={20} />
                <div>
                  <p className="info-box__title">{listing.city || 'Lomé'}</p>
                  <p className="info-box__subtitle">{listing.location || 'Togo'}</p>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Description (pleine largeur) */}
        <div className="product-description-section">
          <h2>Description</h2>
          <p className="description-text">{listing.description}</p>

          {/* Caractéristiques */}
          <div className="product-specifications">
            <h3>Caractéristiques</h3>
            <dl className="specs-list">
              <dt>État</dt>
              <dd>{listing.condition === 'new' ? 'Neuf' : 'Occasion'}</dd>

              <dt>Catégorie</dt>
              <dd>{listing.category}</dd>

              {listing.delivery_available && (
                <>
                  <dt>Livraison</dt>
                  <dd>Disponible</dd>
                </>
              )}
            </dl>
          </div>
        </div>

      </div>
    </div>
  );
}
