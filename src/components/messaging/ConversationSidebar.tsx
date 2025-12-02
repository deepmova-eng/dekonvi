import { useState } from 'react'
import { Search, MoreVertical } from 'lucide-react'
import { SidebarMenu } from './SidebarMenu'
import { ProductCard } from './ProductCard'
import { ConversationItem } from './ConversationItem'
import { ConfirmDialog } from '../shared/ConfirmDialog'
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
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)

    const filteredConversations = conversations.filter(conv => {
        // FIX: Calculate otherUser from user1/user2 (hook returns these, not other_user)
        const otherUser = conv.user1_id === currentUserId ? conv.user2 : conv.user1
        const listing = conv.listing

        // Search in both username and listing title
        const userName = otherUser?.name?.toLowerCase() || ''
        const listingTitle = listing?.title?.toLowerCase() || ''
        const query = searchQuery.toLowerCase()

        return userName.includes(query) || listingTitle.includes(query)
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

        // Show confirmation dialog
        setConversationToDelete(conversationId)
        setShowDeleteDialog(true)
    }

    const confirmDeleteConversation = async () => {
        if (!conversationToDelete) return

        try {
            const { supabase } = await import('../../lib/supabase')
            const { showToast } = await import('../../utils/toast')

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not authenticated')

            // Delete existing deletion record first
            await (supabase as any)
                .from('conversation_deletions')
                .delete()
                .eq('conversation_id', conversationToDelete)
                .eq('user_id', user.id)

            // Then insert new deletion record
            const { error: deleteError } = await (supabase as any)
                .from('conversation_deletions')
                .insert({
                    conversation_id: conversationToDelete,
                    user_id: user.id,
                    deleted_at: new Date().toISOString()
                })

            if (deleteError) throw deleteError

            showToast('success', 'Conversation supprimée', 'La conversation a été supprimée de votre liste')

            if (onDeleteConversation) {
                onDeleteConversation(conversationToDelete)
            }
        } catch (error) {
            console.error('Error deleting conversation:', error)
            const { showToast } = await import('../../utils/toast')
            showToast('error', 'Erreur', 'Erreur lors de la suppression de la conversation')
        } finally {
            setShowDeleteDialog(false)
            setConversationToDelete(null)
        }
    }

    return (
        <div className="fixed inset-0 z-40 flex flex-col bg-white h-[100dvh] w-full overscroll-none md:static md:h-full md:w-auto md:z-auto">

            {/* Header - Fixed at top */}
            <div className="flex-none pt-[env(safe-area-inset-top)]">
                <div className="sidebar-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 0 24px' }}>
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
                </div>

                {/* Product Card - Context de la conversation active */}
                {activeListing && (
                    <div className="px-4 py-3">
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
            </div>

            {/* Conversations list - Scrollable */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-20">
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

            {/* Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={confirmDeleteConversation}
                title="Supprimer la conversation"
                message="Êtes-vous sûr de vouloir supprimer cette conversation ? Elle restera visible pour l'autre utilisateur mais disparaîtra de votre liste."
                confirmText="Supprimer"
                cancelText="Annuler"
                danger={true}
            />
        </div>
    )
}
