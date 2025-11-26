import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Database } from '../../types/supabase';

type Listing = Database['public']['Tables']['listings']['Row'];
type Conversation = Database['public']['Tables']['conversations']['Row'];

interface NewConversationProps {
  onSelect: (conversation: Conversation) => void;
}

import { useSupabase } from '../../contexts/SupabaseContext';

export default function NewConversation({ onSelect }: NewConversationProps) {
  const { user } = useSupabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchListings = async () => {
      if (!searchTerm.trim()) {
        setListings([]);
        return;
      }

      setLoading(true);
      try {
        // const user = supabase.auth.getUser()?.data.user;
        if (!user) return;

        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('status', 'active')
          .neq('seller_id', user.id)
          .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setListings(data || []);
      } catch (error) {
        console.error('Error searching listings:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchListings, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleListingSelect = async (listing: Listing) => {
    // const user = supabase.auth.getUser()?.data.user;
    if (!user) return;

    try {
      // Check for existing conversation
      const { data: existingConversation, error: searchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('listing_id', listing.id)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .or(`user1_id.eq.${listing.seller_id},user2_id.eq.${listing.seller_id}`)
        .maybeSingle();

      if (searchError && searchError.code !== 'PGRST116') throw searchError;

      if (existingConversation) {
        onSelect(existingConversation);
      } else {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            listing_id: listing.id,
            user1_id: user.id,
            user2_id: listing.seller_id,
          })
          .select()
          .single();

        if (createError) throw createError;
        if (newConversation) {
          onSelect(newConversation);
        }
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Erreur lors de la création de la conversation');
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une annonce..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : listings.length > 0 ? (
          <div className="divide-y">
            {listings.map((listing) => (
              <button
                key={listing.id}
                onClick={() => handleListingSelect(listing)}
                className="w-full p-4 flex items-center space-x-4 hover:bg-gray-50"
              >
                <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                  {listing.images?.[0] && (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium text-gray-900">{listing.title}</h3>
                  <p className="text-gray-500">
                    {listing.price.toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : searchTerm ? (
          <div className="text-center py-8 text-gray-500">
            Aucune annonce trouvée
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Recherchez une annonce pour démarrer une conversation
          </div>
        )}
      </div>
    </div>
  );
}