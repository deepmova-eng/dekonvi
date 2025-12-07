import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Sparkles, MoreVertical, Zap } from 'lucide-react';
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

      // Check if error is duplicate boost attempt
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      const isDuplicateError =
        errorMessage.includes('duplicate') ||
        errorMessage.includes('already exists') ||
        errorMessage.includes('pending') ||
        errorMessage.includes('unique');

      if (isDuplicateError) {
        toast('Cette annonce bénéficie déjà d\'un boost ou une demande est en cours.', {
          icon: 'ℹ️',
        });
      } else {
        toast.error('Erreur lors de la demande de boost');
      }
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
              </div>

              <div className="product-content">
                <h3 className="product-title" title={listing.title}>{listing.title}</h3>
                <p className="product-category">{listing.category}</p>
                <p className="product-location">📍 {listing.location}</p>

                <div className="product-footer">
                  <span className="product-price">
                    {listing.price.toLocaleString()} <span className="text-sm ml-1 font-normal text-neutral-500">FCFA</span>
                  </span>

                  {/* Actions Menu Button */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === listing.id ? null : listing.id);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                      title="Actions"
                    >
                      <MoreVertical size={18} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== ACTION SHEET (Fixed Overlay) ===== */}
      {openMenuId && (() => {
        const selectedListing = listings.find(l => l.id === openMenuId);
        if (!selectedListing) return null;

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Overlay noir */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setOpenMenuId(null)}
            />

            {/* Menu blanc */}
            <div className="relative bg-white w-full sm:w-96 sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
              {/* Petite barre de drag (mobile) */}
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-3 sm:hidden" />

              <div className="flex flex-col p-2">
                {/* Option BOOSTER */}
                {!selectedListing.is_premium && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      handleBoostClick(e, selectedListing.id);
                    }}
                    disabled={
                      requestingBoostId === selectedListing.id ||
                      pendingRequests.has(selectedListing.id) ||
                      selectedListing.is_premium
                    }
                    className={`w-full text-left px-4 py-4 font-medium flex items-center gap-4 rounded-xl transition-colors ${pendingRequests.has(selectedListing.id)
                      ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
                      : selectedListing.is_premium
                        ? 'bg-emerald-50 text-emerald-600 cursor-not-allowed'
                        : 'text-gray-800 hover:bg-amber-50'
                      } disabled:opacity-75`}
                  >
                    <div className={`p-2 rounded-full ${pendingRequests.has(selectedListing.id)
                      ? 'bg-gray-200 text-gray-500'
                      : selectedListing.is_premium
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-amber-100 text-amber-600'
                      }`}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-base">
                        {pendingRequests.has(selectedListing.id)
                          ? 'En attente'
                          : selectedListing.is_premium
                            ? 'Boost Actif'
                            : 'Booster l\'annonce'}
                      </span>
                      <span className="block text-xs text-gray-400 font-normal">
                        {pendingRequests.has(selectedListing.id)
                          ? 'Demande en cours de traitement'
                          : selectedListing.is_premium
                            ? 'Annonce déjà boostée'
                            : 'Vendez plus vite'}
                      </span>
                    </div>
                  </button>
                )}

                {/* Option MODIFIER */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(null);
                    onEditingListing(selectedListing);
                  }}
                  className="w-full text-left px-4 py-4 text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-4 rounded-xl transition-colors"
                >
                  <div className="p-2 bg-gray-100 rounded-full text-gray-600">
                    <Edit className="w-5 h-5" />
                  </div>
                  <span className="text-base">Modifier</span>
                </button>

                {/* Ligne de séparation */}
                <div className="h-px bg-gray-100 my-1 mx-4" />

                {/* Option SUPPRIMER */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(null);
                    handleDeleteClick(e, selectedListing.id);
                  }}
                  disabled={deletingId === selectedListing.id}
                  className="w-full text-left px-4 py-4 text-red-600 hover:bg-red-50 font-medium flex items-center gap-4 rounded-xl transition-colors disabled:opacity-50"
                >
                  <div className="p-2 bg-red-100 rounded-full text-red-600">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <span className="text-base">Supprimer</span>
                </button>
              </div>

              {/* Bouton Annuler (Mobile) */}
              <div className="p-4 border-t border-gray-100 sm:hidden">
                <button
                  onClick={() => setOpenMenuId(null)}
                  className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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