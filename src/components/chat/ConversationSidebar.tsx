import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import './ConversationSidebar.css';

interface Conversation {
    id: string;
    user1?: { name?: string; avatar_url?: string };
    user2?: { name?: string; avatar_url?: string };
    listing?: { title?: string; images?: string[] };
    updated_at: string;
    last_message?: any;
    unread_count?: number;
}

interface Props {
    conversations: Conversation[];
    activeId: string | null;
    onSelect: (id: string) => void;
    currentUserId?: string;
}

export function ConversationSidebar({ conversations, activeId, onSelect, currentUserId }: Props) {
    return (
        <div className="conversations-sidebar">
            <div className="sidebar-header">
                <h2>Messages</h2>
                <p className="conversations-count">{conversations.length} conversation{conversations.length > 1 ? 's' : ''}</p>
            </div>

            <div className="conversations-list">
                {conversations.length === 0 ? (
                    <div className="no-conversations">
                        <p>💬 Aucune conversation</p>
                        <span>Commencez à discuter avec un vendeur</span>
                    </div>
                ) : (
                    conversations.map(conv => {
                        // Determine other user
                        const otherUser = conv.user1?.name ? conv.user1 : conv.user2;
                        const userName = otherUser?.name || 'Utilisateur';
                        const userAvatar = otherUser?.avatar_url;

                        return (
                            <div
                                key={conv.id}
                                className={`conversation-item ${activeId === conv.id ? 'active' : ''}`}
                                onClick={() => onSelect(conv.id)}
                            >
                                <div className="conv-avatar">
                                    {userAvatar ? (
                                        <img src={userAvatar} alt={userName} />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {userName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                <div className="conv-content">
                                    <div className="conv-header">
                                        <span className="conv-name">{userName}</span>
                                        <span className="conv-time">
                                            {formatDistanceToNow(new Date(conv.updated_at), {
                                                addSuffix: true,
                                                locale: fr
                                            })}
                                        </span>
                                    </div>

                                    {conv.listing?.title && (
                                        <p className="conv-listing">📦 {conv.listing.title}</p>
                                    )}

                                    <p className="conv-preview">
                                        {conv.last_message?.content || 'Commencez la conversation...'}
                                    </p>
                                </div>

                                {conv.unread_count && conv.unread_count > 0 && (
                                    <div className="conv-badge">{conv.unread_count}</div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
