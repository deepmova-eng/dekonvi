import React, { useState, useEffect } from 'react';
import { Check, X, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import toast from 'react-hot-toast';

type Listing = Database['public']['Tables']['listings']['Row'];

export default function PendingListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setSelectedListing] = useState<Listing | null>(null);

  useEffect(() => {
    const fetchPendingListings = async () => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setListings(data || []);
      } catch (error) {
        console.error('Error fetching pending listings:', error);
        toast.error('Erreur lors du chargement des annonces');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchPendingListings();

    // Subscribe to changes
    const channel = supabase
      .channel('pending_listings')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listings',
          filter: 'status=eq.pending'
        },
        () => {
          fetchPendingListings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprove = async (listing: Listing) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve-listing',
          listingId: listing.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'approbation');
      }

      setListings(listings.filter(l => l.id !== listing.id));
      toast.success('Annonce approuvée');
    } catch (error) {
      console.error('Error approving listing:', error);
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (listing: Listing) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject-listing',
          listingId: listing.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du rejet');
      }

      setListings(listings.filter(l => l.id !== listing.id));
      toast.success('Annonce rejetée');
    } catch (error) {
      console.error('Error rejecting listing:', error);
      toast.error('Erreur lors du rejet');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-bold">Annonces en attente ({listings.length})</h2>
      </div>

      {listings.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          Aucune annonce en attente
        </div>
      ) : (
        <div className="divide-y">
          {listings.map(listing => (
            <div key={listing.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                  {listing.images[0] && (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{listing.title}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(listing.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedListing(listing)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleApprove(listing)}
                  className="p-2 text-green-500 hover:text-green-700"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleReject(listing)}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}