import { useState } from 'react'
import { Search, MoreVertical } from 'lucide-react'
import { SidebarMenu } from './SidebarMenu'
import { ProductCard } from './ProductCard'
import { ConversationItem } from './ConversationItem'
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

    const handleDeleteConversation = async (conversationId: string, e: any) => {
        if (e && e.stopPropagation) e.stopPropagation()



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
                <div className="hidden md:block px-4 py-3 border-b border-gray-200">
                    <ProductCard listing={activeListing} />
                </div>
            )}

            {/* Search */}
            <div className="sidebar-search hidden md:flex">
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
                    filteredConversations.map((conv) => (
                        <ConversationItem
                            key={conv.id}
                            conv={conv}
                            isActive={activeId === conv.id}
                            currentUserId={currentUserId}
                            onSelect={onSelect}
                            onDelete={handleDeleteConversation}
                            getTimeAgo={getTimeAgo}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
