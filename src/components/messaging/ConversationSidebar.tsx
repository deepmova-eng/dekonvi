import { useState } from 'react'
import { Search, MoreVertical, Trash2 } from 'lucide-react'
import { SidebarMenu } from './SidebarMenu'
import { ProductCard } from './ProductCard'
import './ConversationSidebar.css'

interface Props {
    conversations: any[]
    activeId: string | null
    onSelect: (id: string) => void
    currentUserId: string
    activeListing?: any | null
    onDeleteConversation?: (conversationId: string) => void
}

export function ConversationSidebar({ conversations, activeId, onSelect, currentUserId, activeListing, onDeleteConversation }: Props) {
    const [searchQuery, setSearchQuery] = useState('')
    const [showMenu, setShowMenu] = useState(false)
    const [activeConvMenu, setActiveConvMenu] = useState<string | null>(null)

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

    const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
        e.stopPropagation()

        const confirm = window.confirm(
            'Êtes-vous sûr de vouloir supprimer cette conversation ? Elle restera visible pour l\'autre utilisateur.'
        )
        if (!confirm) return

        try {
            const { supabase } = await import('../../lib/supabase')
            const { showToast } = await import('../../utils/toast')

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not authenticated')

            const { error: deleteError } = await (supabase as any)
                .from('conversation_deletions')
                .insert({
                    conversation_id: conversationId,
                    user_id: user.id
                })

            if (deleteError) throw deleteError

            showToast('success', 'Conversation supprimée', 'La conversation a été supprimée de votre liste')

            setActiveConvMenu(null)
            if (onDeleteConversation) {
                onDeleteConversation(conversationId)
            }
        } catch (error) {
            console.error('Error deleting conversation:', error)
            const { showToast } = await import('../../utils/toast')
            showToast('error', 'Erreur', 'Erreur lors de la suppression de la conversation')
        }
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
                        const listing = conv.listing
                        const lastMessage = conv.last_message?.[0]
                        const isActive = activeId === conv.id
                        const unreadCount = conv.unread_count || 0
                        const showConvMenu = activeConvMenu === conv.id

                        return (
                            <div key={conv.id} className="conversation-item-wrapper">
                                <button
                                    className={`conversation-item ${isActive ? 'active' : ''}`}
                                    onClick={() => onSelect(conv.id)}
                                >
                                    {/* Listing Image */}
                                    <div className="conv-avatar-wrapper">
                                        <img
                                            src={listing?.images?.[0] || '/placeholder-product.png'}
                                            alt={listing?.title || 'Annonce'}
                                            className="conv-avatar"
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="conv-content">
                                        <div className="conv-header">
                                            <span className="conv-name">{listing?.title || 'Annonce'}</span>
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

                                {/* Delete menu button */}
                                <button
                                    className="conv-menu-btn"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setActiveConvMenu(showConvMenu ? null : conv.id)
                                    }}
                                >
                                    <MoreVertical size={18} />
                                </button>

                                {/* Delete menu dropdown */}
                                {showConvMenu && (
                                    <div className="conv-menu-dropdown">
                                        <button
                                            className="conv-menu-item danger"
                                            onClick={(e) => handleDeleteConversation(conv.id, e)}
                                        >
                                            <Trash2 size={16} />
                                            <span>Supprimer</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
