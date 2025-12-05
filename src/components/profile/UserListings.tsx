import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSupabase } from '../../contexts/SupabaseContext';
import type { Database } from '../../types/supabase';
import toast from 'react-hot-toast';
import '../../product-card.css';

type Listing = Database['public']['Tables']['listings']['Row'];

interface UserListingsProps {
  onCreateListing: () => void;
  onEditingListing: (listing: Listing | null) => void;
  onProductSelect?: (id: string) => void;
}

export default function UserListings({
  onCreateListing,
  onEditingListing,
  onProductSelect
}: UserListingsProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [requestingBoostId, setRequestingBoostId] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());

  const { user } = useSupabase();

  useEffect(() => {
    if (!user) return;

    const fetchPendingRequests = async () => {
      try {
        const { data, error } = await supabase
          .from('premium_requests')
          .select('listing_id')
          .eq('user_id', user.id)
          .eq('status', 'pending');

        if (error) {
          // Silently fail if table doesn't exist or other error
          console.warn('Could not fetch pending requests:', error.message);
          return;
        }

        if (data) {
          setPendingRequests(new Set(data.map(r => r.listing_id)));
        }
      } catch (error) {
        console.error('Error fetching pending requests:', error);
      }
    };

    fetchPendingRequests();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchListings = async () => {
      try {
        // ✅ No timeout - let Supabase complete naturally
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setListings(data || []);
      } catch (error) {
        console.error('Error fetching listings:', error);

        // Fallback to REST API (network errors only)
        if (error instanceof Error && error.message.includes('Failed to fetch')) {
          console.log('fetchListings failed, using REST API fallback...');
          try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            const response = await fetch(
              `${supabaseUrl}/rest/v1/listings?select=*&seller_id=eq.${user.id}&order=created_at.desc`,
              {
                headers: {
                  'apikey': supabaseAnonKey,
                  'Authorization': `Bearer ${supabaseAnonKey}`
                }
              }
            );

            if (response.ok) {
              const data = await response.json();
              console.log('User listings loaded via REST API:', data.length);
              setListings(data || []);
            } else {
              console.error('REST API listings fetch failed:', response.status);
              toast.error('Erreur lors du chargement des annonces');
            }
          } catch (fetchErr) {
            console.error('REST API listings fallback error:', fetchErr);
            toast.error('Erreur lors du chargement des annonces');
          }
        } else {
          toast.error('Erreur lors du chargement des annonces');
        }
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchListings();

    // Subscribe to changes
    const channel = supabase
      .channel('user_listings')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listings',
          filter: `seller_id=eq.${user.id}`
        },
        () => {
          fetchListings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);



  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'boost', id: string } | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, listingId: string) => {
    e.stopPropagation();
    setConfirmAction({ type: 'delete', id: listingId });
  };

  const handleBoostClick = (e: React.MouseEvent, listingId: string) => {
    e.stopPropagation();
    setConfirmAction({ type: 'boost', id: listingId });
  };

  const confirmDelete = async () => {
    if (!confirmAction || confirmAction.type !== 'delete') return;
    const listingId = confirmAction.id;
    setConfirmAction(null);

    try {
      setDeletingId(listingId);

      // Optimistic update: remove from local state immediately
      const previousListings = listings;
      setListings(prev => prev.filter(l => l.id !== listingId));

      const { error, count } = await supabase
        .from('listings')
        .delete({ count: 'exact' })
        .eq('id', listingId);

      if (error) throw error;

      if (count === 0) {
        // Revert if no rows were deleted (likely RLS issue)
        setListings(previousListings);
        throw new Error('Aucune annonce supprimée (Permission refusée ?)');
      }

      toast.success('Annonce supprimée avec succès');
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error('Erreur lors de la suppression');
      // Revert optimistic update
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user!.id)
        .order('created_at', { ascending: false });
      if (data) setListings(data);
    } finally {
      setDeletingId(null);
    }
  };

  const confirmBoost = async () => {
    if (!confirmAction || confirmAction.type !== 'boost') return;
    const listingId = confirmAction.id;
    setConfirmAction(null);

    try {
      setRequestingBoostId(listingId);

      const boostData = {
        listing_id: listingId,
        user_id: user!.id,  // Fixed: use user_id instead of seller_id
        duration: 30,
        price: 5000
      };

      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), 5000)
        );

        const insertQuery = supabase
          .from('premium_requests')
          .insert(boostData);

        const { error } = await Promise.race([
          insertQuery,
          timeoutPromise
        ]) as any;

        if (error) throw error;
      } catch (error) {
        console.error('Error creating boost request:', error);

        // Fallback to REST API
        if (error instanceof Error && error.message === 'Query timeout') {
          console.log('Boost request timed out, using REST API fallback...');
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

          const response = await fetch(`${supabaseUrl}/rest/v1/premium_requests`, {
            method: 'POST',
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(boostData)
          });

          if (!response.ok) {
            throw new Error(`REST API fallback failed: ${response.statusText}`);
          }
        } else {
          throw error;
        }
      }

      toast.success('Demande de boost envoyée avec succès');
    } catch (error) {
      console.error('Error requesting boost:', error);
      toast.error('Erreur lors de la demande de boost');
    } finally {
      setRequestingBoostId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!listings?.length) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 mb-4">Vous n'avez pas encore d'annonces</p>
        <button
          onClick={onCreateListing}
          className="bg-primary-500 text-white px-6 py-2 rounded-full hover:bg-primary-600 transition-colors flex items-center justify-center mx-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          Créer une annonce
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={onCreateListing}
          className="bg-primary-500 text-white px-6 py-2 rounded-full hover:bg-primary-600 transition-colors flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Créer une annonce
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="relative group cursor-pointer h-full"
            onClick={() => onProductSelect?.(listing.id)}
          >
            <div className="product-card">
              <div className="product-image-container">
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  loading="lazy"
                />

                {listing.is_premium && (
                  <div className="badge-premium">
                    <Sparkles size={12} />
                    <span>Boosté</span>
                  </div>
                )}

                {pendingRequests.has(listing.id) && !listing.is_premium && (
                  <div className="absolute top-3 left-3 bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full shadow-sm z-10 flex items-center gap-1">
                    <Sparkles size={12} />
                    <span>En attente</span>
                  </div>
                )}

                {/* Action Buttons Overlay */}
                <div className="absolute top-3 right-3 flex gap-2 z-10">
                  {!listing.is_premium && (
                    <button
                      onClick={(e) => handleBoostClick(e, listing.id)}
                      disabled={requestingBoostId === listing.id}
                      className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm transition-all ${requestingBoostId === listing.id
                        ? 'bg-white/50 cursor-not-allowed'
                        : 'bg-white/90 hover:bg-white hover:scale-110 text-amber-500'
                        }`}
                      title="Booster l'annonce"
                    >
                      <Sparkles size={16} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditingListing(listing);
                    }}
                    className="w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center backdrop-blur-md shadow-sm hover:scale-110 transition-all text-primary-500"
                    title="Modifier"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, listing.id)}
                    disabled={deletingId === listing.id}
                    className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm transition-all ${deletingId === listing.id
                      ? 'bg-white/50 cursor-not-allowed'
                      : 'bg-white/90 hover:bg-white hover:scale-110 text-red-500'
                      }`}
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="product-content">
                <h3 className="product-title" title={listing.title}>{listing.title}</h3>
                <p className="product-category">{listing.category}</p>
                <p className="product-location">📍 {listing.location}</p>

                <div className="product-footer">
                  <span className="product-price">
                    {listing.price.toLocaleString()} <span className="text-sm ml-1 font-normal text-neutral-500">FCFA</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-4">
              {confirmAction.type === 'delete' ? 'Supprimer l\'annonce' : 'Booster l\'annonce'}
            </h3>
            <p className="text-gray-600 mb-6">
              {confirmAction.type === 'delete'
                ? 'Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.'
                : 'Le boost d\'annonce est un service payant qui coûte 5000 FCFA pour 30 jours. Votre annonce sera mise en avant. Voulez-vous continuer ?'
              }
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmAction.type === 'delete' ? confirmDelete : confirmBoost}
                className={`px-6 py-3 text-white font-bold rounded-lg transition-colors ${confirmAction.type === 'delete'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-600 hover:bg-green-700'
                  }`}
              >
                {confirmAction.type === 'delete' ? 'Supprimer' : 'Booster pour 5000 FCFA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}