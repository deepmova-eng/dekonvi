import React, { useState } from 'react';
import { Shield, Ban, User, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useAllUsers } from '../../hooks/useAdmin';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '../shared/ConfirmDialog';

type Profile = Database['public']['Tables']['profiles']['Row'];

type ExtendedUser = Profile & {
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  status?: string;
};

interface UserManagementProps {
  filter?: 'pending' | 'confirmed';
}

export default function UserManagement({ filter = 'confirmed' }: UserManagementProps) {
  // ✅ React Query hook - remplace useState + useEffect
  const { data: users = [], isLoading: loading } = useAllUsers();

  const [search, setSearch] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'ban' | 'admin' | 'confirm' | 'delete';
    user: ExtendedUser | null;
    title: string;
    message: string;
    danger?: boolean;
  }>({ type: 'ban', user: null, title: '', message: '' });

  const handleBanUser = async (user: ExtendedUser) => {
    setConfirmAction({
      type: 'ban',
      user,
      title: user.status === 'banned' ? 'Débannir l\'utilisateur' : 'Bannir l\'utilisateur',
      message: `Êtes-vous sûr de vouloir ${user.status === 'banned' ? 'débannir' : 'bannir'} cet utilisateur ?`,
      danger: user.status !== 'banned'
    });
    setShowConfirmDialog(true);
  };

  const executeBan = async (user: ExtendedUser) => {

    try {
      const newStatus = user.status === 'banned' ? 'active' : 'banned';
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'ban-user',
          userId: user.id,
          status: newStatus
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la mise à jour du statut');
      }

      toast.success(user.status === 'banned' ? 'Utilisateur débanni' : 'Utilisateur banni');

      // Force refresh users list
      window.location.reload();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleMakeAdmin = async (user: ExtendedUser) => {
    setConfirmAction({
      type: 'admin',
      user,
      title: user.role === 'admin' ? 'Rétrograder l\'utilisateur' : 'Promouvoir l\'utilisateur',
      message: `Êtes-vous sûr de vouloir ${user.role === 'admin' ? 'rétr ograder' : 'promouvoir'} cet utilisateur ?`,
      danger: false
    });
    setShowConfirmDialog(true);
  };

  const executeAdmin = async (user: ExtendedUser) => {

    try {
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle-admin',
          userId: user.id,
          role: newRole
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la mise à jour du rôle');
      }

      toast.success(user.role === 'admin' ? 'Administrateur rétrogradé' : 'Administrateur promu');

      // Force refresh users list
      window.location.reload();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Erreur lors de la mise à jour du rôle');
    }
  };

  const handleConfirmUser = async (user: ExtendedUser) => {
    setConfirmAction({
      type: 'confirm',
      user,
      title: 'Confirmer l\'utilisateur',
      message: 'Voulez-vous confirmer manuellement cet utilisateur ?',
      danger: false
    });
    setShowConfirmDialog(true);
  };

  const executeConfirmUser = async (user: ExtendedUser) => {

    const toastId = toast.loading('Confirmation en cours...');

    try {
      console.log('Attempting to confirm user:', user.id);
      const { error } = await supabase.rpc('confirm_user_admin' as any, {
        target_user_id: user.id
      });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }

      toast.success('Utilisateur confirmé avec succès', { id: toastId });

      // Reload page to refresh user list from DB
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('Error confirming user:', error);
      toast.error(`Erreur: ${error.message || 'Échec de la confirmation'}`, { id: toastId });
    }
  };

  const handleDeleteUser = async (user: ExtendedUser) => {
    setConfirmAction({
      type: 'delete',
      user,
      title: 'Supprimer l\'utilisateur',
      message: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.',
      danger: true
    });
    setShowConfirmDialog(true);
  };

  const executeDeleteUser = async (user: ExtendedUser) => {

    const toastId = toast.loading('Suppression en cours...');

    try {
      const { error } = await supabase.rpc('delete_user_admin' as any, {
        target_user_id: user.id
      });

      if (error) throw error;

      toast.success('Utilisateur supprimé avec succès', { id: toastId });

      // Reload page to refresh user list
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(`Erreur: ${error.message || 'Échec de la suppression'}`, { id: toastId });
    }
  };

  const handleConfirm = async () => {
    if (!confirmAction.user) return;

    switch (confirmAction.type) {
      case 'ban':
        await executeBan(confirmAction.user);
        break;
      case 'admin':
        await executeAdmin(confirmAction.user);
        break;
      case 'confirm':
        await executeConfirmUser(confirmAction.user);
        break;
      case 'delete':
        await executeDeleteUser(confirmAction.user);
        break;
    }

    setShowConfirmDialog(false);
    setConfirmAction({ type: 'ban', user: null, title: '', message: '' });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'pending') {
      return !user.email_confirmed_at;
    } else {
      return !!user.email_confirmed_at;
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-bold mb-4">
          {filter === 'pending' ? 'Demandes en attente' : 'Utilisateurs confirmés'}
        </h2>
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Mobile View - Decision Cards */}
      <div className="md:hidden space-y-4 p-4">
        {filteredUsers.map(user => (
          <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
            {/* Header - Avatar & Status Badge */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-base truncate">
                    {user.name}
                  </h3>
                  <p className="text-xs text-gray-500 break-all mt-0.5">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex-shrink-0 ml-2">
                {!user.email_confirmed_at && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                    En attente
                  </span>
                )}
                {user.email_confirmed_at && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            </div>

            {/* Additional Badges */}
            <div className="flex items-center flex-wrap gap-2 mb-4">
              {user.status === 'banned' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  Banni
                </span>
              )}
              {user.role === 'admin' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                  Administrateur
                </span>
              )}
            </div>

            {/* Action Buttons - Grid 2 columns */}
            <div className="grid grid-cols-2 gap-3">
              {/* Delete/Refuse Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteUser(user);
                }}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium text-sm min-h-[44px]"
              >
                <Trash2 className="w-4 h-4" />
                <span>Refuser</span>
              </button>

              {/* Validate Button (conditional) */}
              {!user.email_confirmed_at ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirmUser(user);
                  }}
                  style={{ backgroundColor: '#10B981' }}
                  className="flex items-center justify-center space-x-2 px-4 py-3 text-white rounded-xl transition-all font-semibold text-sm shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 min-h-[44px] border-none"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Valider</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBanUser(user);
                  }}
                  className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all font-medium text-sm min-h-[44px] ${user.status === 'banned'
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    }`}
                >
                  <Ban className="w-4 h-4" />
                  <span>{user.status === 'banned' ? 'Débannir' : 'Bannir'}</span>
                </button>
              )}
            </div>

            {/* Admin Toggle (if confirmed) */}
            {user.email_confirmed_at && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMakeAdmin(user);
                }}
                className={`w-full mt-3 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg transition-all font-medium text-sm ${user.role === 'admin'
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                  }`}
              >
                <Shield className="w-4 h-4" />
                <span>{user.role === 'admin' ? 'Retirer Admin' : 'Promouvoir Admin'}</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Desktop View - Table Layout */}
      <div className="hidden md:block divide-y">
        {filteredUsers.map(user => (
          <div key={user.id} className="p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  {user.name}
                  {user.email_confirmed_at ? (
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-orange-500" />
                  )}
                </h3>
                <p className="text-sm text-gray-500">{user.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  {user.status === 'banned' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Banni
                    </span>
                  )}
                  {user.role === 'admin' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-500/10 text-primary-500">
                      Administrateur
                    </span>
                  )}
                  {!user.email_confirmed_at && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                      Non confirmé
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {!user.email_confirmed_at && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirmUser(user);
                  }}
                  className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                  title="Confirmer l'utilisateur"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMakeAdmin(user);
                }}
                className={`p-2 rounded-full transition-colors cursor-pointer ${user.role === 'admin'
                  ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  : 'text-primary-500 hover:text-primary-600 hover:bg-green-50'
                  }`}
                title={user.role === 'admin' ? 'Rétrograder' : 'Promouvoir Admin'}
              >
                <Shield className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteUser(user);
                }}
                className="flex items-center px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer mr-2"
                title="Supprimer l'utilisateur"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Supprimer</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBanUser(user);
                }}
                className={`p-2 rounded-full transition-colors cursor-pointer ${user.status === 'banned'
                  ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  : 'text-orange-500 hover:text-orange-700 hover:bg-orange-50'
                  }`}
                title={user.status === 'banned' ? 'Débannir' : 'Bannir'}
              >
                <Ban className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirm}
        title={confirmAction.title}
        message={confirmAction.message}
        confirmText="Confirmer"
        cancelText="Annuler"
        danger={confirmAction.danger}
      />
    </div>
  );
}