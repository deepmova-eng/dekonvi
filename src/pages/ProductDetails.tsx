import { useState, useEffect } from 'react';
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
  ArrowLeft,
  User,
  Star
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useProduct } from '../hooks/useProduct';
import { useIsFavorite, useToggleFavorite } from '../hooks/useFavorites';
import { useSupabase } from '../contexts/SupabaseContext';
import './ProductDetails.css';
import { supabase } from '../lib/supabase';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSupabase();
  const { product: listing, loading: isLoading, error } = useProduct(id!);
  const { data: isFavorite = false } = useIsFavorite(id!);
  const { mutate: toggleFavorite } = useToggleFavorite();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [sellerProfile, setSellerProfile] = useState<any>(null);

  // Fetch seller profile when listing loads
  useEffect(() => {
    const fetchSellerProfile = async () => {
      if (!listing?.seller_id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, rating, total_ratings')
        .eq('id', listing.seller_id)
        .single();

      if (!error && data) {
        setSellerProfile(data);
      }
    };

    fetchSellerProfile();
  }, [listing?.seller_id]);

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
      alert('Veuillez vous connecter pour envoyer un message');
      navigate('/login');
      return;
    }

    if (user.id === listing.seller_id) {
      alert('Vous ne pouvez pas envoyer un message à vous-même');
      return;
    }

    try {
      const { supabase } = await import('../lib/supabase');

      // Vérifier si une conversation existe déjà (dans les 2 sens)
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listing.id)
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${listing.seller_id}),and(user1_id.eq.${listing.seller_id},user2_id.eq.${user.id})`)
        .maybeSingle();

      if (existingConv) {
        // La conversation existe, vérifier si elle a été soft-deleted par l'utilisateur
        const { data: deletion } = await (supabase as any)
          .from('conversation_deletions')
          .select('id')
          .eq('conversation_id', existingConv.id)
          .eq('user_id', user.id)
          .maybeSingle();

        // Si la conversation a été supprimée par l'utilisateur
        if (deletion) {
          // NE PAS supprimer conversation_deletions !
          // On garde deleted_at pour filtrer les anciens messages

          // Envoyer un message initial pour rouvrir la conversation
          const initialMessage = `Bonjour, je suis intéressé(e) par votre annonce "${listing.title}".`;

          const { error: messageError } = await supabase
            .from('messages')
            .insert({
              conversation_id: existingConv.id,
              sender_id: user.id,
              content: initialMessage,
              read: false
            });

          if (messageError) {
            throw new Error(`Failed to send message: ${messageError.message}`);
          }

          // Rediriger vers la messagerie
          navigate(`/messages?conversation=${existingConv.id}`);
          return;
        }

        // Naviguer vers la conversation
        navigate(`/messages?conversation=${existingConv.id}`);
      } else {
        // Créer nouvelle conversation
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            listing_id: listing.id,
            user1_id: user.id,
            user2_id: listing.seller_id,
          })
          .select('id')
          .single();

        if (error) {
          console.error('❌ Error creating conversation:', error);
          throw error;
        }

        // Auto-envoyer un message initial pour que le vendeur soit notifié
        const initialMessage = `Bonjour, je suis intéressé(e) par votre annonce "${listing.title}".`;

        console.log('📤 Sending initial message:', {
          conversation_id: newConv.id,
          sender_id: user.id,
          to_seller: listing.seller_id,
          message: initialMessage
        });

        const { data: messageData, error: messageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: newConv.id,
            sender_id: user.id,
            content: initialMessage,
            read: false
          })
          .select();

        if (messageError) {
          console.error('❌ Error sending initial message:', messageError);
          throw new Error(`Failed to send message: ${messageError.message}`);
        }

        console.log('✅ Initial message sent successfully:', messageData);

        // Naviguer vers la nouvelle conversation
        navigate(`/messages?conversation=${newConv.id}`);
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

                {/* Bouton premium profil vendeur */}
                {sellerProfile && (
                  <button
                    className="btn btn--seller-profile btn--large"
                    onClick={() => navigate(`/profile/${listing.seller_id}`)}
                  >
                    <div className="seller-profile-btn-content">
                      {/* Avatar */}
                      <div className="seller-avatar">
                        {sellerProfile.avatar_url ? (
                          <img src={sellerProfile.avatar_url} alt={sellerProfile.name} />
                        ) : (
                          <div className="seller-avatar-placeholder">
                            {sellerProfile.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Nom et rating sur la même ligne */}
                      <div className="seller-info">
                        <span className="seller-name">{sellerProfile.name}</span>
                        <div className="seller-rating">
                          <Star
                            size={16}
                            className="star-icon"
                            fill="#FFD700"
                            strokeWidth={0}
                          />
                          <span className="rating-text">
                            {sellerProfile.rating || 5} ({sellerProfile.total_ratings || 0})
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                )}

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
