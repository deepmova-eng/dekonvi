import React, { useState, useEffect } from 'react';
import { ChevronLeft, Star, Shield, Phone, Clock, MapPin } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSupabase } from '../contexts/SupabaseContext';
import ProductCard from '../components/home/ProductCard';
import ReviewForm from '../components/reviews/ReviewForm';
import ReviewList from '../components/reviews/ReviewList';
import type { Database } from '../types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Listing = Database['public']['Tables']['listings']['Row'];

export default function SellerProfile() {
  const { id: sellerId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSupabase();
  const [seller, setSeller] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [refreshReviews, setRefreshReviews] = useState(0);

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        // Fetch seller profile with timeout
        const profileTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile query timeout')), 3000)
        );

        const profileQuery = supabase
          .from('profiles')
          .select('*')
          .eq('id', sellerId)
          .single();

        let sellerData;
        try {
          const { data, error } = await Promise.race([
            profileQuery,
            profileTimeoutPromise
          ]) as any;
          if (error) throw error;
          sellerData = data;
        } catch (error) {
          // Profile Fallback
          if (error instanceof Error && error.message === 'Profile query timeout') {
            console.log('[SellerProfile] profile fetch timed out, using REST API fallback...');
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            const response = await fetch(
              `${supabaseUrl}/rest/v1/profiles?id=eq.${sellerId}&select=*`,
              {
                headers: {
                  'apikey': supabaseAnonKey,
                  'Authorization': `Bearer ${supabaseAnonKey}`,
                  'Accept': 'application/vnd.pgrst.object+json' // Request single object
                }
              }
            );

            if (response.ok) {
              sellerData = await response.json();
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        }
        setSeller(sellerData);

        // Fetch seller's active listings with timeout
        const listingsTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Listings query timeout')), 3000)
        );

        const listingsQuery = supabase
          .from('listings')
          .select('*')
          .eq('seller_id', sellerId)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        let listingsData;
        try {
          const { data, error } = await Promise.race([
            listingsQuery,
            listingsTimeoutPromise
          ]) as any;
          if (error) throw error;
          listingsData = data;
        } catch (error) {
          // Listings Fallback
          if (error instanceof Error && error.message === 'Listings query timeout') {
            console.log('[SellerProfile] listings fetch timed out, using REST API fallback...');
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            const response = await fetch(
              `${supabaseUrl}/rest/v1/listings?seller_id=eq.${sellerId}&status=eq.active&select=*&order=created_at.desc`,
              {
                headers: {
                  'apikey': supabaseAnonKey,
                  'Authorization': `Bearer ${supabaseAnonKey}`
                }
              }
            );

            if (response.ok) {
              listingsData = await response.json();
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        }
        setListings(listingsData || []);

      } catch (error) {
        console.error('Error fetching seller data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchSellerData();

    // Subscribe to changes
    const profileChannel = supabase
      .channel('seller_profile')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${sellerId}`
        },
        () => {
          fetchSellerData();
        }
      )
      .subscribe();

    const listingsChannel = supabase
      .channel('seller_listings')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listings',
          filter: `seller_id=eq.${sellerId}`
        },
        () => {
          fetchSellerData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(listingsChannel);
    };
  }, [sellerId]);

  const formatTimeAgo = (date: string) => {
    const minutes = Math.floor((new Date().getTime() - new Date(date).getTime()) / 60000);
    if (minutes < 60) return `il y a ${minutes} minutes`;
    if (minutes < 1440) return `il y a ${Math.floor(minutes / 60)} heures`;
    return `il y a ${Math.floor(minutes / 1440)} jours`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-500">Vendeur non trouvé</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 bg-primary-500 text-white px-6 py-2 rounded-full hover:bg-primary-600 transition-colors"
        >
          Retour
        </button>
      </div>
    );
  }

  // Filter listings by category
  const filteredListings = selectedCategory === 'all'
    ? listings
    : listings.filter(listing => listing.category === selectedCategory);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white z-20 px-4 py-4 border-b">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-600">
            <ChevronLeft className="w-6 h-6" />
            <span>Retour</span>
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-white p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
            <div className="relative">
              <div className="h-20 w-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {seller.avatar_url ? (
                  <img
                    src={seller.avatar_url}
                    alt={seller.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-gray-500">
                    {seller.name.charAt(0)}
                  </span>
                )}
              </div>
              {seller.is_recommended && (
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
                  <Shield className="w-5 h-5 text-primary-500" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{seller.name}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3 h-3 sm:w-4 sm:h-4 ${star <= seller.rating
                        ? 'fill-primary-500 text-primary-500'
                        : 'text-gray-300'
                        }`}
                    />
                  ))}
                </div>
                <span className="text-xs sm:text-sm text-gray-500">
                  ({seller.total_ratings} avis)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {listings.length} annonces en ligne
              </p>
            </div>
          </div>
        </div>

        {seller.is_recommended && (
          <div className="bg-primary-500/10 text-primary-500 text-sm px-3 py-2 rounded-lg flex items-center mb-4">
            <Shield className="w-4 h-4 mr-2" />
            Profil recommandé
          </div>
        )}

        {/* Seller Stats */}
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center">
            <Phone className="w-4 h-4 mr-2" />
            {seller.phone ? 'Numéro vérifié' : 'Numéro non vérifié'}
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Membre depuis {new Date(seller.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Dernière activité {formatTimeAgo(seller.last_seen)}
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            {seller.location || 'Localisation non spécifiée'}
          </div>
        </div>

        {/* Action Buttons */}
        {user && user.id !== sellerId && (
          <div className="mt-4">
            <button
              onClick={() => setShowReviewForm(true)}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Laisser un avis
            </button>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-6 border-t pt-6">
          <ReviewList sellerId={sellerId} refreshTrigger={refreshReviews} />
        </div>
      </div>

      {/* Review Modal */}
      {showReviewForm && (
        <ReviewForm
          sellerId={sellerId}
          onSuccess={() => {
            setShowReviewForm(false);
            setRefreshReviews(prev => prev + 1);
          }}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* Listings */}
      <div className="mt-4">
        <div className="px-4 mb-4">
          <h2 className="text-xl font-bold">Annonces de {seller.name}</h2>
        </div>

        {/* Categories */}
        <div className="overflow-x-auto scrollbar-hide mb-4">
          <div className="flex space-x-2 px-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-full whitespace-nowrap ${selectedCategory === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700'
                }`}
            >
              Tout voir
            </button>
            {Array.from(new Set(listings.map(l => l.category))).map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-full whitespace-nowrap ${selectedCategory === category
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        <div className="px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredListings.map(listing => (
              <ProductCard
                key={listing.id}
                listing={listing}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}