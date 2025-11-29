import React, { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface ConversationActionsProps {
  conversationId: string;
  onClose?: () => void;
}

import { useSupabase } from '../../contexts/SupabaseContext';
// ...

export default function ConversationActions({ conversationId, onClose }: ConversationActionsProps) {
  const { user } = useSupabase();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteConversation = async () => {
    setShowMenu(false);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      if (!user) return;

      // Delete conversation and related messages using RPC
      const { error } = await supabase.rpc('delete_conversation', {
        p_conversation_id: conversationId,
        p_user_id: user.id
      });

      if (error) throw error;

      toast.success('Conversation supprimée', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: 'var(--primary-500)',
          color: '#fff'
        }
      });

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <MoreHorizontal className="w-6 h-6 text-gray-500" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg z-20 py-1">
            <button
              onClick={() => {
                setShowMenu(false);
                handleDeleteConversation();
              }}
              className="w-full px-4 py-2 text-left text-red-500 hover:bg-gray-50"
            >
              Supprimer la conversation
            </button>
          </div>
        </>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Supprimer la conversation"
        message="Voulez-vous vraiment supprimer cette conversation ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        danger={true}
      />
    </div>
  );
}