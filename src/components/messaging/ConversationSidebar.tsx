import { useState } from 'react'
import { Search, MoreVertical } from 'lucide-react'
import { SidebarMenu } from './SidebarMenu'
import { ProductCard } from './ProductCard'
import './ConversationSidebar.css'

interface Props {
    conversations: any[]
    activeId: string | null
    onSelect: (id: string) => void
    currentUserId: string
    activeListing?: any | null
}

export function ConversationSidebar({ conversations, activeId, onSelect, currentUserId, activeListing }: Props) {
    const [searchQuery, setSearchQuery] = useState('')
    const [showMenu, setShowMenu] = useState(false)

    const filteredConversations = conversations.filter(conv => {
        const otherUser = conv.other_user
        return otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    })

    const getTimeAgo = (date: string) => {
        const now = new Date()
        const then = new Date(date)
        const diffMs = now.getTime() - then.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return "À l'instant"
        if (diffMins < 60) return `${diffMins}min`
        if (diffHours < 24) return `${diffHours}h`
        if (diffDays === 1) return "Hier"
        if (diffDays < 7) return `${diffDays}j`
        return then.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    }

    return (
        <div className="conversation-sidebar">

            {/* Header */}
            <div className="sidebar-header">
                <h2>Messages</h2>
                <button
                    className="header-menu-btn"
                    onClick={() => setShowMenu(!showMenu)}
                >
                    <MoreVertical size={20} />
                </button>

                {/* Menu dropdown */}
                {showMenu && (
                    <SidebarMenu
                        onClose={() => setShowMenu(false)}
                        conversationCount={conversations.length}
                    />
                )}
            </div>

            {/* Product Card - Context de la conversation active */}
            {activeListing && (
                <div className="px-4 py-3 border-b border-gray-200">
                    <ProductCard listing={activeListing} />
                </div>
            )}

            {/* Search */}
            <div className="sidebar-search">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Rechercher une conversation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
            </div>

            {/* Conversations list */}
            <div className="conversations-list">
                {filteredConversations.length === 0 ? (
                    <div className="empty-conversations">
                        <p>Aucune conversation trouvée</p>
                    </div>
                ) : (
                    filteredConversations.map((conv) => {
                        const otherUser = conv.other_user
                        const lastMessage = conv.last_message?.[0]
                        const isActive = activeId === conv.id
                        const unreadCount = conv.unread_count || 0

                        return (
                            <button
                                key={conv.id}
                                className={`conversation-item ${isActive ? 'active' : ''}`}
                                onClick={() => onSelect(conv.id)}
                            >
                                {/* Avatar */}
                                <div className="conv-avatar-wrapper">
                                    <img
                                        src={otherUser?.avatar_url || '/default-avatar.png'}
                                        alt={otherUser?.name}
                                        className="conv-avatar"
                                    />
                                    <div className="online-status" />
                                </div>

                                {/* Content */}
                                <div className="conv-content">
                                    <div className="conv-header">
                                        <span className="conv-name">{otherUser?.name || 'Utilisateur'}</span>
                                        {lastMessage && (
                                            <span className="conv-time">{getTimeAgo(lastMessage.created_at)}</span>
                                        )}
                                    </div>

                                    <div className="conv-footer">
                                        <p className="conv-preview">
                                            {lastMessage?.sender_id === currentUserId && 'Vous: '}
                                            {lastMessage?.content || 'Aucun message'}
                                        </p>
                                        {unreadCount > 0 && (
                                            <div className="unread-badge">{unreadCount}</div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        )
                    })
                )}
            </div>
        </div>
    )
}
