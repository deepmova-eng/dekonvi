import React from 'react';
import { User, MessageSquare } from 'lucide-react';
import { useConversations, useMarkMessagesAsRead } from '../../hooks/useMessages';
import { useSupabase } from '../../contexts/SupabaseContext';
import '../../notifications-messages.css';
import { ConversationSkeleton } from '../common/ConversationSkeleton';

interface ConversationListProps {
  onSelectConversation: (conversation: any) => void;
  selectedId?: string;
}

export default function ConversationList({ onSelectConversation, selectedId }: ConversationListProps) {
  const { user: currentUser } = useSupabase();
  const { data: conversations = [], isLoading: loading, error } = useConversations(currentUser?.id);
  const markAsRead = useMarkMessagesAsRead();

  // Marquer comme lu quand on change de conversation
  React.useEffect(() => {
    if (selectedId) {
      markAsRead.mutate(selectedId);
    }
  }, [selectedId]);

  const formatDate = (date: string) => {
    if (!date) return '';

    const now = new Date();
    const messageDate = new Date(date);

    if (isNaN(messageDate.getTime())) {
      return '';
    }

    const diff = now.getTime() - messageDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return "Aujourd'hui";
    } else if (days === 1) {
      return "Hier";
    } else if (days < 7) {
      return messageDate.toLocaleDateString('fr-FR', { weekday: 'long' });
    } else {
      return messageDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long'
      });
    }
  };

  if (loading) {
    return (
      <div className="divide-y divide-gray-100">
        {[1, 2, 3, 4, 5].map((i) => (
          <ConversationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Erreur lors du chargement des conversations</p>
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <div className="flex justify-center mb-4">
          <MessageSquare size={48} className="text-gray-200" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune conversation</h3>
        <p className="text-gray-500 text-sm">Vos conversations apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map((conversation: any) => {
        // Determine other participant
        const otherParticipant = conversation.user1_id === currentUser?.id
          ? conversation.user2
          : conversation.user1;

        const listing = conversation.listing;
        const isActive = selectedId === conversation.id;
        const lastMessage = conversation.last_message;
        const date = conversation.last_message_at || conversation.created_at;
        const timeStr = formatDate(date);

        // Check for unread messages (assuming unread_count is available or calculating it)
        // Note: The current query might not return unread_count directly unless we add a count query or similar.
        // For now, let's assume we can rely on the 'read' status of the last message if we had it, 
        // but typically unread_count is better. 
        // Since the user prompt implies we might need to rely on visual cues, let's stick to the requested logic.
        // If unread_count is not in the schema yet, we might need to add it or fetch it.
        // However, the user provided code uses `conv.unread_count`. Let's check if `unread_count` is in the Supabase query.
        // Looking at `useConversations` hook, it selects `*`. If `unread_count` is a column or view, it will be there.
        // If not, we might need to adjust. The user's prompt assumes it exists or we can use it.
        // Let's use `conversation.unread_count` as requested.

        const hasUnread = !isActive && (conversation.unread_count > 0);

        return (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation)}
            className={`
              conversation-item 
              ${isActive ? 'active bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}
              ${hasUnread ? 'bg-green-50' : ''}
              hover:bg-gray-50 cursor-pointer p-4 transition-all duration-200
            `}
          >
            <div className="flex items-start gap-3">
              <div className="conversation-avatar relative flex-shrink-0">
                {listing?.images && listing.images.length > 0 ? (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : otherParticipant?.avatar_url ? (
                  <img
                    src={otherParticipant.avatar_url}
                    alt={otherParticipant.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full">
                    <User className="text-gray-400" size={24} />
                  </div>
                )}
              </div>

              <div className="conversation-info flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className={`text-sm ${hasUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>
                    {otherParticipant?.name || 'Utilisateur'}
                    {listing && <span className="text-xs text-gray-500 ml-2 font-normal">• {listing.title}</span>}
                  </h4>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{timeStr}</span>
                </div>

                <div className="flex justify-between items-center mt-1">
                  <p className={`text-sm truncate ${hasUnread ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                    {lastMessage || 'Nouvelle conversation'}
                  </p>
                  {hasUnread && (
                    <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-green-500 rounded-full">
                      {conversation.unread_count > 0 ? conversation.unread_count : 'Nouveau'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}