import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
import { useQueryClient } from '@tanstack/react-query';
import { useProduct } from '../hooks/useProduct';
import { useIsFavorite, useToggleFavorite } from '../hooks/useFavorites';
import { useSupabase } from '../contexts/SupabaseContext';
import { useSellerProfile } from '../hooks/useProfile';
import './ProductDetails.css';
import { supabase } from '../lib/supabase';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSupabase();
  const queryClient = useQueryClient();
  const { product: listing, loading: isLoading, error } = useProduct(id!);
  const { data: isFavorite = false } = useIsFavorite(id!);
  const { mutate: toggleFavorite } = useToggleFavorite();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // ✅ React Query hook - remplace useEffect seller fetch
  const { data: sellerProfile } = useSellerProfile(listing?.seller_id);

  // ⚡ Prefetch complet pour page vendeur (hover)
  const handleSellerHover = () => {
    if (!listing?.seller_id) return;

    // Prefetch seller profile complet
    queryClient.prefetchQuery({
      queryKey: ['seller-profile', listing.seller_id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', listing.seller_id)
          .single();

        if (error) throw error;
        return data;
      },
      staleTime: 1000 * 60 * 10,
    });

    // Prefetch seller listings
    queryClient.prefetchQuery({
      queryKey: ['seller-listings', listing.seller_id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('seller_id', listing.seller_id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      },
      staleTime: 1000 * 60 * 5,
    });

    // Prefetch seller reviews
    queryClient.prefetchQuery({
      queryKey: ['seller-reviews', listing.seller_id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('reviews')
          .select(`
            *,
            profiles:buyer_id (
              name
            )
          `)
          .eq('seller_id', listing.seller_id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching reviews:', error);
          return [];
        }
        return data || [];
      },
      staleTime: 1000 * 60 * 5,
    });
  };

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
              <div className="product-actions mobile-action-bar">
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

        {/* ═══════════════════════════════════════ */}
        {/* SECTION VENDEUR - ULTRA PREMIUM */}
        {/* ═══════════════════════════════════════ */}
        {sellerProfile && (
          <div className="product-description-section" style={{ marginBottom: '24px' }}>
            <h2>Vendeur</h2>

            <Link
              to={`/seller/${listing.seller_id}`}
              className="group block"
              style={{ textDecoration: 'none' }}
              onMouseEnter={handleSellerHover}
            >
              <div
                className="seller-premium-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'linear-gradient(to right, #F9FAFB, white)',
                  border: '1px solid #E5E7EB',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2DD181';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(45, 209, 129, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Avatar avec badge vérifié */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #D1FAE5, #ECFDF5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid white',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {sellerProfile.avatar_url ? (
                      <img
                        src={sellerProfile.avatar_url}
                        alt={sellerProfile.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{
                        color: '#059669',
                        fontWeight: 700,
                        fontSize: '24px',
                      }}>
                        {sellerProfile.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Badge vérifié */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-4px',
                      right: '-4px',
                      width: '24px',
                      height: '24px',
                      background: '#2DD181',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid white',
                    }}
                  >
                    <svg style={{ width: '14px', height: '14px', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {/* Infos vendeur */}
                <div style={{ flex: 1, minWidth: 0, marginLeft: '16px' }}>
                  {/* Nom + flèche */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{
                      fontWeight: 600,
                      fontSize: '18px',
                      color: '#111827',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      transition: 'color 0.3s ease',
                    }}>
                      {sellerProfile.name}
                    </h4>
                    <svg
                      style={{ width: '20px', height: '20px', color: '#9CA3AF', flexShrink: 0, transition: 'all 0.3s ease' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                  {/* Membre depuis */}
                  <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0' }}>
                    Membre depuis {new Date(sellerProfile.created_at || Date.now()).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </p>

                  {/* Étoiles et avis */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                    {sellerProfile.total_ratings > 0 ? (
                      <>
                        {/* Étoiles */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={i < Math.floor(sellerProfile.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300'}
                              size={16}
                            />
                          ))}
                        </div>

                        {/* Note */}
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                          {sellerProfile.rating.toFixed(1)}
                        </span>

                        {/* Nombre avis */}
                        <span style={{ fontSize: '14px', color: '#6B7280' }}>
                          ({sellerProfile.total_ratings} avis)
                        </span>
                      </>
                    ) : (
                      /* Pas d'avis */
                      <span style={{ fontSize: '14px', color: '#6B7280', fontStyle: 'italic' }}>
                        Aucun avis
                      </span>
                    )}
                  </div>
                </div>

                {/* Badge "Voir profil" */}
                <div style={{ flexShrink: 0 }}>
                  <div
                    className="voir-profil-badge"
                    style={{
                      padding: '8px 16px',
                      background: '#ECFDF5',
                      color: '#059669',
                      fontSize: '14px',
                      fontWeight: 500,
                      borderRadius: '20px',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Voir profil
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

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
