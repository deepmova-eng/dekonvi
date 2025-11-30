import React, { useState } from 'react';
import { AlertTriangle, Check, X, Eye } from 'lucide-react';
import { useReportedListings, useResolveReport } from '../../hooks/useAdmin';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import toast from 'react-hot-toast';

type Report = Database['public']['Tables']['reports']['Row'] & {
  listing: Database['public']['Tables']['listings']['Row'];
  reporter: Database['public']['Tables']['profiles']['Row'];
};

export default function ReportedListings() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // ✅ React Query hook - remplace useState + useEffect
  const { data: reports = [], isLoading: loading } = useReportedListings();
  const resolveMutation = useResolveReport();

  const handleResolve = async (report: Report) => {
    try {
      // Call the resolve_report RPC function
      const { error } = await supabase.rpc('resolve_report', {
        report_id: report.id,
        listing_id: report.listing_id
      });

      if (error) throw error;

      // Invalide le cache via React Query
      await resolveMutation.mutateAsync(report.id);
      toast.success('Signalement résolu et annonce supprimée');
    } catch (error) {
      console.error('Error resolving report:', error);
      toast.error('Erreur lors de la résolution');
    }
  };

  const handleDismiss = async (report: Report) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'dismissed' as const })
        .eq('id', report.id);

      if (error) throw error;

      // Invalide le cache via React Query
      await resolveMutation.mutateAsync(report.id);
      toast.success('Signalement ignoré');
    } catch (error) {
      console.error('Error dismissing report:', error);
      toast.error('Erreur lors du rejet');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (selectedReport) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Détails du signalement</h2>
          <button
            onClick={() => setSelectedReport(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-900">Annonce signalée</h3>
            <p className="text-gray-600">{selectedReport.listing.title}</p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">Raison</h3>
            <p className="text-gray-600">{selectedReport.reason}</p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">Description</h3>
            <p className="text-gray-600">{selectedReport.description}</p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">Signalé par</h3>
            <p className="text-gray-600">{selectedReport.reporter.name}</p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">Date</h3>
            <p className="text-gray-600">
              {new Date(selectedReport.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              onClick={() => handleResolve(selectedReport)}
              className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
            >
              Résoudre et supprimer l'annonce
            </button>
            <button
              onClick={() => handleDismiss(selectedReport)}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Ignorer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-bold">Signalements ({reports.length})</h2>
      </div>

      {reports.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          Aucun signalement en attente
        </div>
      ) : (
        <div className="divide-y">
          {reports.map(report => (
            <div key={report.id} className="p-6 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="font-medium text-gray-900">{report.listing.title}</h3>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Signalé par {report.reporter.name} • {new Date(report.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-red-500 mt-1">
                  Raison : {report.reason}
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedReport(report)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleResolve(report)}
                  className="p-2 text-green-500 hover:text-green-700"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDismiss(report)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}