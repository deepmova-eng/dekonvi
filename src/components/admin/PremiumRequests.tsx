import React, { useState, useEffect } from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import toast from 'react-hot-toast';

type PremiumRequest = Database['public']['Tables']['premium_requests']['Row'] & {
  listings?: { title: string } | null;
  profiles?: { name: string } | null;
};

export default function PremiumRequests() {
  const [requests, setRequests] = useState<PremiumRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPremiumRequests = async () => {
      try {
        // 1. Fetch requests with listings
        const { data: requestsData, error: requestsError } = await supabase
          .from('premium_requests')
          .select(`
            *,
            listings(title)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (requestsError) throw requestsError;

        if (!requestsData || requestsData.length === 0) {
          setRequests([]);
          return;
        }

        // 2. Fetch profiles manually
        const userIds = [...new Set(requestsData.map(r => r.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          // Continue without profiles
        }

        // 3. Merge data
        const enrichedRequests = requestsData.map(req => ({
          ...req,
          listings: Array.isArray(req.listings) ? req.listings[0] : req.listings,
          profiles: profilesData?.find(p => p.id === req.user_id) || null
        }));

        setRequests(enrichedRequests);
      } catch (error) {
        console.error('Error fetching premium requests:', error);
        toast.error('Erreur lors du chargement des demandes');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchPremiumRequests();

    // Subscribe to changes
    const channel = supabase
      .channel('premium_requests_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'premium_requests',
          filter: 'status=eq.pending'
        },
        () => {
          fetchPremiumRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprove = async (request: PremiumRequest) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve-premium',
          listingId: request.listing_id,
          requestId: request.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'approbation');
      }

      toast.success('Demande approuvée');
      // Refresh list
      setRequests(requests.filter(r => r.id !== request.id));
    } catch (error) {
      console.error('Error approving premium request:', error);
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (request: PremiumRequest) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject-premium',
          requestId: request.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du rejet');
      }

      toast.success('Demande rejetée');
      // Refresh list
      setRequests(requests.filter(r => r.id !== request.id));
    } catch (error) {
      console.error('Error rejecting premium request:', error);
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
        <h2 className="text-xl font-bold">Demandes Premium ({requests.length})</h2>
      </div>

      {requests.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          Aucune demande en attente
        </div>
      ) : (
        <div className="divide-y">
          {requests.map(request => (
            <div key={request.id} className="p-6 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="font-medium text-gray-900">
                    {request.listings?.title || 'Annonce supprimée'}
                  </h3>
                </div>
                <p className="text-sm text-gray-500">
                  Par {request.profiles?.name} • {new Date(request.created_at).toLocaleDateString()}
                </p>
                <div className="flex items-center mt-2 text-sm text-gray-600">
                  <span>{request.duration} jours • {request.price.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleApprove(request)}
                  className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleReject(request)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
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