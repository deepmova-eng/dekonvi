import { useRef, useEffect, useState } from 'react'
import { ExternalLink, Flag, Ban, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '../shared/ConfirmDialog'
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
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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

    const handleBlock = () => {
        // TODO: Implémenter blocage utilisateur
        alert('Fonctionnalité de blocage à venir')
        onClose()
    }

    const handleDelete = () => {
        setShowDeleteDialog(true)
    }

    const confirmDeleteConversation = async () => {
        try {
            const { supabase } = await import('../../lib/supabase')
            const { showToast } = await import('../../utils/toast')

            // Get current user ID
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not authenticated')

            // Soft delete: delete old entry then insert new one
            // This avoids RLS policy issues with upsert

            // First, delete any existing deletion record
            await (supabase as any)
                .from('conversation_deletions')
                .delete()
                .eq('conversation_id', conversationId)
                .eq('user_id', user.id)

            // Then insert new deletion record with current timestamp
            const { error: deleteError } = await (supabase as any)
                .from('conversation_deletions')
                .insert({
                    conversation_id: conversationId,
                    user_id: user.id,
                    deleted_at: new Date().toISOString()
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
