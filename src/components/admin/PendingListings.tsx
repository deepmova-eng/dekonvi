import React, { useState } from 'react';
import { Check, X, Eye, ChevronLeft, ChevronRight, User, MapPin, Calendar, Package } from 'lucide-react';
import { usePendingListings, useApproveListing, useRejectListing } from '../../hooks/useAdmin';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import toast from 'react-hot-toast';

type Listing = Database['public']['Tables']['listings']['Row'];

export default function PendingListings() {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ✅ React Query hooks - remplace tout le code useEffect
  const { data: listings = [], isLoading: loading } = usePendingListings();
  const approveMutation = useApproveListing();
  const rejectMutation = useRejectListing();

  const handleApprove = async (listing: Listing) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve-listing',
          listingId: listing.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'approb ation');
      }

      // Invalider le cache automatiquement via React Query
      await approveMutation.mutateAsync(listing.id);
      toast.success('Annonce approuvée');
    } catch (error) {
      console.error('Error approving listing:', error);
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (listing: Listing) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject-listing',
          listingId: listing.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du rejet');
      }

      // Invalider le cache automatiquement via React Query
      await rejectMutation.mutateAsync({ listingId: listing.id });
      toast.success('Annonce rejetée');
    } catch (error) {
      console.error('Error rejecting listing:', error);
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

  const handleCloseModal = () => {
    setSelectedListing(null);
    setCurrentImageIndex(0);
  };

  const handleNextImage = () => {
    if (selectedListing && selectedListing.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === selectedListing.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handlePrevImage = () => {
    if (selectedListing && selectedListing.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? selectedListing.images.length - 1 : prev - 1
      );
    }
  };

  return (
    <>
      {/* Preview Modal */}
      {selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">Prévisualisation de l'annonce</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Image Carousel */}
              {selectedListing.images && selectedListing.images.length > 0 && (
                <div className="relative bg-gray-100 rounded-xl overflow-hidden">
                  <div className="aspect-video relative">
                    <img
                      src={selectedListing.images[currentImageIndex]}
                      alt={`Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-contain"
                    />

                    {/* Navigation Arrows */}
                    {selectedListing.images.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all"
                        >
                          <ChevronLeft className="w-6 h-6 text-gray-800" />
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all"
                        >
                          <ChevronRight className="w-6 h-6 text-gray-800" />
                        </button>

                        {/* Image Counter */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                          {currentImageIndex + 1} / {selectedListing.images.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Grid */}
                  {selectedListing.images.length > 1 && (
                    <div className="flex gap-2 p-4 overflow-x-auto">
                      {selectedListing.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex
                            ? 'border-green-500 ring-2 ring-green-200'
                            : 'border-gray-300 hover:border-gray-400'
                            }`}
                        >
                          <img
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Listing Details */}
              <div className="space-y-4">
                {/* Title & Price */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">{selectedListing.title}</h3>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      {selectedListing.price.toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                </div>

                {/* Meta Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Package className="w-5 h-5" />
                    <span>Catégorie: <span className="font-medium text-gray-900">{selectedListing.category}</span></span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="w-5 h-5" />
                    <span>Localisation: <span className="font-medium text-gray-900">{selectedListing.location}</span></span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="w-5 h-5" />
                    <span>Publié: <span className="font-medium text-gray-900">
                      {new Date(selectedListing.created_at).toLocaleDateString('fr-FR')}
                    </span></span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <User className="w-5 h-5" />
                    <span>Vendeur ID: <span className="font-medium text-gray-900 text-xs">{selectedListing.seller_id}</span></span>
                  </div>
                </div>

                {/* Description */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Description complète</h4>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selectedListing.description}
                    </p>
                  </div>
                </div>

                {/* Additional Details if exists */}
                {selectedListing.condition && (
                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">État</h4>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {selectedListing.condition}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer - Actions */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-end space-x-4">
              <button
                onClick={handleCloseModal}
                className="hidden md:block px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  handleReject(selectedListing);
                  handleCloseModal();
                }}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center space-x-2"
              >
                <X className="w-5 h-5" />
                <span>Refuser</span>
              </button>
              <button
                onClick={() => {
                  handleApprove(selectedListing);
                  handleCloseModal();
                }}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center space-x-2"
              >
                <Check className="w-5 h-5" />
                <span>Approuver</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-bold">Annonces en attente ({listings.length})</h2>
        </div>

        {listings.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Aucune annonce en attente
          </div>
        ) : (
          <div className="divide-y">
            {listings.map(listing => (
              <div key={listing.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                    {listing.images[0] && (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{listing.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setSelectedListing(listing)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleApprove(listing)}
                    className="p-2 text-green-500 hover:text-green-700"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleReject(listing)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}