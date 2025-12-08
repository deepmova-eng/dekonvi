import React, { useState } from 'react';
import { AlertTriangle, X, Flag, ExternalLink, Ban, Trash2 } from 'lucide-react';
import { useReportedListings, useResolveReport } from '../../hooks/useAdmin';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

type Report = Database['public']['Tables']['reports']['Row'] & {
  listings?: Database['public']['Tables']['listings']['Row'] | null;
  reported_user?: Database['public']['Tables']['profiles']['Row'] | null;
  reporter: Database['public']['Tables']['profiles']['Row'];
};

// Labels pour les motifs
const reasonLabels: Record<string, string> = {
  scam: 'Arnaque',
  spam: 'Spam',
  inappropriate: 'Contenu inapproprié',
  other: 'Autre'
};

export default function ReportedListings() {
  const [showSanctionModal, setShowSanctionModal] = useState<Report | null>(null);
  const queryClient = useQueryClient();

  // ✅ React Query hook
  const { data: reports = [], isLoading: loading } = useReportedListings();

  // Dismiss report (mark as dismissed)
  const handleDismiss = async (report: Report) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'dismissed' })
        .eq('id', report.id);

      if (error) throw error;

      toast.success('Signalement ignoré');

      // ✅ INSTANT UPDATE - Update cache immediately
      queryClient.setQueryData(['admin', 'reported-listings'], (oldData: Report[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(r => r.id !== report.id);
      });
    } catch (error) {
      console.error('Error dismissing report:', error);
      toast.error('Erreur lors du rejet');
    }
  };

  // Sanction (delete listing or ban user)
  const handleSanction = async (report: Report, action: 'delete-listing' | 'ban-user') => {
    try {
      if (action === 'delete-listing' && report.listing_id) {
        // Supprimer l'annonce
        const { error } = await supabase
          .from('listings')
          .delete()
          .eq('id', report.listing_id);

        if (error) throw error;
        toast.success('Annonce supprimée');
      } else if (action === 'ban-user' && report.reported_user_id) {
        // Bannir l'utilisateur
        const { error } = await supabase
          .from('profiles')
          .update({ status: 'banned' })
          .eq('id', report.reported_user_id);

        if (error) throw error;
        toast.success('Utilisateur banni');
      }

      // Mark report as resolved
      await supabase
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', report.id);

      // ✅ INSTANT UPDATE - Remove from list
      queryClient.setQueryData(['admin', 'reported-listings'], (oldData: Report[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(r => r.id !== report.id);
      });

      setShowSanctionModal(null);
    } catch (error) {
      console.error('Error sanctioning:', error);
      toast.error('Erreur lors de la sanction');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-bold">Signalements ({reports.length})</h2>
        </div>

        {reports.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Aucun signalement en attente
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {reports.map(report => (
              <div key={report.id} className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Header - Badge Motif */}
                <div className="px-4 pt-4 pb-3">
                  <div className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold ${report.reason === 'scam' ? 'bg-red-100 text-red-700' :
                    report.reason === 'spam' ? 'bg-orange-100 text-orange-700' :
                      report.reason === 'inappropriate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                    }`}>
                    <AlertTriangle className="w-3 h-3 mr-1.5 inline" />
                    {reasonLabels[report.reason]?.toUpperCase() || report.reason.toUpperCase()}
                  </div>
                </div>

                {/* Content - Cible (Listing ou User) */}
                <div className="px-4 pb-3">
                  {report.target_type === 'listing' && report.listings ? (
                    <div className="flex gap-3">
                      {report.listings.images?.[0] && (
                        <img
                          src={report.listings.images[0]}
                          alt="Annonce"
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {report.listings.title}
                        </h3>
                        <a
                          href={`/listings/${report.listing_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 text-sm hover:underline flex items-center gap-1 mt-1"
                        >
                          Voir l'annonce
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ) : report.target_type === 'user' && report.reported_user ? (
                    <div className="flex gap-3">
                      <img
                        src={report.reported_user.avatar_url || '/default-avatar.png'}
                        alt="User"
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {report.reported_user.name}
                        </h3>
                        <a
                          href={`/profile/${report.reported_user_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 text-sm hover:underline flex items-center gap-1 mt-1"
                        >
                          Voir le profil
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Cible non trouvée</p>
                  )}

                  {/* Description si exists */}
                  {report.description && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                      {report.description}
                    </p>
                  )}

                  {/* Plaignant + Date */}
                  <p className="text-xs text-gray-500 mt-3">
                    Signalé par <span className="font-medium">{report.reporter.name}</span>
                    {' • '}
                    {formatDistanceToNow(new Date(report.created_at), {
                      addSuffix: true,
                      locale: fr
                    })}
                  </p>
                </div>

                {/* Actions - 50/50 Grid */}
                <div className="grid grid-cols-2 gap-3 p-4 pt-0">
                  <button
                    onClick={() => handleDismiss(report)}
                    className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all font-medium text-sm min-h-[44px] border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    <X className="w-4 h-4" />
                    <span>Ignorer</span>
                  </button>

                  <button
                    onClick={() => setShowSanctionModal(report)}
                    className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all font-semibold text-sm min-h-[44px] bg-red-500 text-white hover:bg-red-600 shadow-lg"
                  >
                    <Flag className="w-4 h-4" />
                    <span>Sanctionner</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sanction Modal */}
      {showSanctionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Choisir la sanction</h3>
              <button
                onClick={() => setShowSanctionModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Cette action est irréversible. Choisissez la sanction appropriée :
            </p>

            <div className="space-y-3">
              {showSanctionModal.target_type === 'listing' && (
                <button
                  onClick={() => handleSanction(showSanctionModal, 'delete-listing')}
                  className="w-full flex items-center gap-3 px-4 py-4 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Supprimer l'annonce</p>
                    <p className="text-sm text-gray-600">L'annonce sera définitivement supprimée</p>
                  </div>
                </button>
              )}

              {showSanctionModal.target_type === 'user' && (
                <button
                  onClick={() => handleSanction(showSanctionModal, 'ban-user')}
                  className="w-full flex items-center gap-3 px-4 py-4 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                    <Ban className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Bannir l'utilisateur</p>
                    <p className="text-sm text-gray-600">L'utilisateur sera banni de la plateforme</p>
                  </div>
                </button>
              )}

              <button
                onClick={() => setShowSanctionModal(null)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}