import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useSendMessage } from '../../hooks/useMessages';
import { useNotificationsContext } from '../../contexts/NotificationsContext';

interface ConversationProps {
  conversationId: string;
  onBack: () => void;
}

export default function Conversation({ conversationId, onBack }: ConversationProps) {
  // BYPASS REACT QUERY - Direct Supabase fetch
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const { mutate: sendMessage } = useSendMessage();
  const { setCurrentConversationId } = useNotificationsContext();
  const queryClient = useQueryClient();

  console.log('🚀 [Conversation] Component mounted with conversationId:', conversationId);

  const [conversationData, setConversationData] = useState<{
    listingId?: string;
    listingTitle?: string;
    listingImage?: string;
    listingPrice?: number;
    otherParticipantName?: string;
    otherParticipantAvatar?: string;
    otherParticipantRating?: number;
    otherParticipantResponseTime?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // DIRECT FETCH: Bypass React Query and fetch messages directly
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      setMessagesLoading(true);
      console.log('📡 [Direct Fetch] Fetching messages for:', conversationId);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ [Direct Fetch] Error:', error);
      } else {
        console.log('✅ [Direct Fetch] Loaded messages:', data?.length);
        setMessages(data || []);
      }

      setMessagesLoading(false);
    };

    fetchMessages();


    // ✅ UNIFIED Realtime subscription: adds to state + marks as read
    console.log('🔔 [Realtime] Setting up unified subscription for:', conversationId);
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          console.log('🔔 [Realtime] New message received:', payload.new);

          // 1. ALWAYS add message to state (for both sender and receiver)
          setMessages(prev => [...prev, payload.new as any]);

          // 2. Mark as read if from another user
          const { data: { user } } = await supabase.auth.getUser();
          if (user && (payload.new as any).sender_id !== user.id) {
            console.log('🔔 [Realtime] Marking message as read:', (payload.new as any).id);

            await supabase
              .from('messages')
              .update({ read: true })
              .eq('id', (payload.new as any).id);

            console.log('✅ [Realtime] Message marked as read');

            // 3. Invalidate queries to update sidebar/notifications
            queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 [Realtime] Subscription status:', status);
      });

    return () => {
      console.log('🔔 [Realtime] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  // Fonction pour marquer les messages comme lus
  const markMessagesAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!conversationId || !user) return;

    console.log('📖 [MarkAsRead] Starting...');

    const { data: updated, error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('read', false)
      .select();

    console.log('📖 [MarkAsRead] Updated messages:', updated?.length);

    if (error) {
      console.error('📖 [MarkAsRead] Error:', error);
    }

    if (!error) {
      console.log('📖 [MarkAsRead] Invalidating caches...');
      queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      // Pas besoin d'invalider 'messages' ici car on a déjà les messages
    }
  };

  // Set current conversation ID for notification suppression and mark as read on mount
  useEffect(() => {
    if (conversationId) {
      setCurrentConversationId(conversationId);
      markMessagesAsRead();

      return () => {
        setCurrentConversationId(null);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, setCurrentConversationId]);

  // Mark as read when new messages arrive (via React Query update)
  useEffect(() => {
    if (messages && messages.length > 0) {
      markMessagesAsRead();
    }
  }, [messages?.length]);

  useEffect(() => {
    const fetchConversationDetails = async () => {
      try {
        const { data: conversation } = await supabase
          .from('conversations')
          .select('*, listings(id,title,images,price)')
          .eq('id', conversationId)
          .single();

        if (conversation) {
          // listings can be either an object or an array depending on the join
          const listing = Array.isArray(conversation.listings)
            ? (conversation.listings.length > 0 ? conversation.listings[0] : null)
            : conversation.listings;

          // Fetch other participant details
          const { data: { user } } = await supabase.auth.getUser();

          // Determine other participant ID based on user1_id/user2_id
          const conv = conversation as any;
          const otherParticipantId = conv.user1_id === user?.id
            ? conv.user2_id
            : conv.user1_id;

          let otherUser = null;
          if (otherParticipantId) {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', otherParticipantId)
              .single();
            otherUser = data;
          }

          setConversationData({
            listingId: listing?.id,
            listingTitle: listing?.title,
            listingImage: listing?.images?.[0],
            listingPrice: listing?.price,
            otherParticipantName: otherUser?.name || 'Utilisateur',
            otherParticipantAvatar: otherUser?.avatar_url,
            otherParticipantRating: otherUser?.rating || 0,
            otherParticipantResponseTime: (otherUser as any)?.response_time || 3
          });
        }
      } catch (error) {
        console.error('Error loading conversation details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversationDetails();
  }, [conversationId]);

  // ✅ Duplicate subscription removed - now unified above (line 61-104)

  // Show loading while messages or conversation data is loading
  if (loading || messagesLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <>
      {/* Header Hybride - Produit en vedette, User en contexte */}
      <div className="mt-4 h-20 shrink-0 border-b flex items-center px-4 bg-white z-20 relative shadow-sm">
        <div className="flex items-center gap-4 w-full">
          {onBack && (
            <button onClick={onBack} className="md:hidden p-1 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
          )}

          {/* Image Produit (Gauche) */}
          <div
            className="relative shrink-0 cursor-pointer group"
            onClick={() => conversationData?.listingId && window.open(`/listings/${conversationData.listingId}`, '_blank')}
          >
            {conversationData?.listingImage ? (
              <img
                src={conversationData.listingImage}
                alt={conversationData.listingTitle}
                className="w-12 h-12 rounded-lg object-cover bg-gray-100 border border-gray-100 group-hover:opacity-90 transition-opacity"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-100 flex items-center justify-center text-gray-400">
                <span className="text-xs">IMG</span>
              </div>
            )}
          </div>

          {/* Info Centrale */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-bold text-gray-900 truncate text-base">
                {conversationData?.listingTitle || 'Annonce sans titre'}
              </h3>
              <span className="font-bold text-primary-600 whitespace-nowrap text-base">
                {conversationData?.listingPrice ? `${conversationData.listingPrice.toLocaleString()} FCFA` : ''}
              </span>
            </div>

            <p className="text-sm text-gray-500 truncate">
              Discussion avec <span className="font-medium text-gray-700">{conversationData?.otherParticipantName || 'Utilisateur'}</span>
            </p>
          </div>
        </div>
      </div>

      <MessageList messages={messages} />
      <MessageInput onSend={async (content) => {
        // Send message
        sendMessage({ conversationId, content });

        // Manually refetch messages after sending
        setTimeout(async () => {
          const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

          if (data) {
            console.log('🔄 [Manual Refetch] After send:', data.length);
            setMessages(data);
          }
        }, 500);
      }} />
    </>
  );
}