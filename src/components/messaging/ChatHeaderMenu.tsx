import { useRef, useEffect } from 'react'
import { ExternalLink, Flag, Ban, Trash2 } from 'lucide-react'
import './ChatHeaderMenu.css'

interface Props {
    listingId: string | null
    otherUserId: string
    conversationId: string
    onClose: () => void
    onConversationDeleted?: () => void
}

export function ChatHeaderMenu({ listingId, otherUserId, conversationId, onClose, onConversationDeleted }: Props) {
    const menuRef = useRef<HTMLDivElement>(null)

    // Ferme le menu si on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [onClose])

    const handleViewListing = () => {
        if (listingId) {
            window.location.href = `/listings/${listingId}`
        }
        onClose()
    }

    const handleReport = () => {
        // TODO: Ouvrir modal de signalement
        alert('Fonctionnalité de signalement à venir')
        onClose()
    }

    const handleBlock = async () => {
        const confirm = window.confirm(
            'Êtes-vous sûr de vouloir bloquer cet utilisateur ? Vous ne pourrez plus échanger avec lui.'
        )
        if (!confirm) return

        try {
            // TODO: Implémenter le blocage dans Supabase
            alert('Utilisateur bloqué (fonctionnalité à implémenter)')
            onClose()
        } catch (error) {
            console.error('Error blocking user:', error)
            alert('Erreur lors du blocage')
        }
    }

    const handleDelete = async () => {
        const confirm = window.confirm(
            'Êtes-vous sûr de vouloir supprimer cette conversation ? Elle restera visible pour l\'autre utilisateur.'
        )
        if (!confirm) return

        try {
            const { supabase } = await import('../../lib/supabase')
            const { showToast } = await import('../../utils/toast')

            // Get current user ID
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not authenticated')

            // Soft delete: insert into conversation_deletions table
            const { error: deleteError } = await supabase
                .from('conversation_deletions')
                .insert({
                    conversation_id: conversationId,
                    user_id: user.id
                })

            if (deleteError) throw deleteError

            // Show success toast
            showToast('success', 'Conversation supprimée', 'La conversation a été supprimée de votre liste')

            // Notify parent to refresh and deselect
            onClose()
            if (onConversationDeleted) {
                onConversationDeleted()
            }
        } catch (error) {
            console.error('Error deleting conversation:', error)
            const { showToast } = await import('../../utils/toast')
            showToast('error', 'Erreur', 'Erreur lors de la suppression de la conversation')
        }
    }

    return (
        <div className="chat-header-menu" ref={menuRef}>
            <button
                className="menu-item"
                onClick={handleViewListing}
                disabled={!listingId}
            >
                <ExternalLink size={18} />
                <span>Voir l'annonce</span>
            </button>

            <div className="menu-divider" />

            <button className="menu-item" onClick={handleReport}>
                <Flag size={18} />
                <span>Signaler</span>
            </button>

            <button className="menu-item danger" onClick={handleBlock}>
                <Ban size={18} />
                <span>Bloquer l'utilisateur</span>
            </button>

            <div className="menu-divider" />

            <button className="menu-item danger" onClick={handleDelete}>
                <Trash2 size={18} />
                <span>Supprimer la conversation</span>
            </button>
        </div>
    )
}
