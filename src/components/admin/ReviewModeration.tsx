import React, { useState } from 'react';
import { usePendingReviews, useApproveReview, useRejectReview } from '../../hooks/useAdmin';
import { supabase } from '../../lib/supabase';
import { useSupabase } from '../../contexts/SupabaseContext';
import { Check, X, ExternalLink, Star, Image as ImageIcon } from 'lucide-react';
import type { Database } from '../../types/supabase';
import toast from 'react-hot-toast';

type Review = Database['public']['Tables']['reviews']['Row'] & {
    profiles: {
        name: string;
        email: string;
    };
    listings: {
        title: string;
        images: string[];
    } | null;
};

export default function ReviewModeration() {
    const { user } = useSupabase();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // ✅ React Query hooks - remplace useState + useEffect
    const { data: reviews = [], isLoading: loading } = usePendingReviews();
    const approveMutation = useApproveReview();
    const rejectMutation = useRejectReview();

    const handleModeration = async (reviewId: string, status: 'approved' | 'rejected') => {
        try {
            if (status === 'approved') {
                await approveMutation.mutateAsync(reviewId);
                toast.success('Avis approuvé');
            } else {
                await rejectMutation.mutateAsync(reviewId);
                toast.success('Avis rejeté');
            }
        } catch (error) {
            console.error('Error updating review:', error);
            toast.error('Erreur lors de la modération');
        }
    };

    const getPublicUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const { data } = supabase.storage.from('review-proofs').getPublicUrl(path);
        return data.publicUrl;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Modération des Avis</h2>

            {reviews.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    Aucun avis en attente de validation.
                </div>
            ) : (
                <div className="grid gap-6">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-white rounded-lg shadow-sm border p-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Proof Image */}
                                <div className="w-full md:w-1/4">
                                    <div
                                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer relative group"
                                        onClick={() => setSelectedImage(getPublicUrl(review.proof_image_url || ''))}
                                    >
                                        {review.proof_image_url ? (
                                            <img
                                                src={getPublicUrl(review.proof_image_url)}
                                                alt="Preuve d'achat"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                <ImageIcon className="w-8 h-8" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-center text-gray-500 mt-2">Cliquez pour agrandir</p>
                                </div>

                                {/* Review Details */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-lg">{review.profiles.name}</h3>
                                            <p className="text-sm text-gray-500">{review.profiles.email}</p>
                                        </div>
                                        <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                                            <span className="font-bold text-yellow-700">{review.rating}/5</span>
                                        </div>
                                    </div>

                                    {review.listings && (
                                        <div className="bg-gray-50 p-3 rounded-md text-sm">
                                            <span className="font-medium text-gray-700">Produit concerné : </span>
                                            <span className="text-gray-600">{review.listings.title}</span>
                                        </div>
                                    )}

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-gray-700 italic">"{review.comment || 'Aucun commentaire'}"</p>
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-2">
                                        <button
                                            onClick={() => handleModeration(review.id, 'rejected')}
                                            className="flex items-center px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Refuser
                                        </button>
                                        <button
                                            onClick={() => handleModeration(review.id, 'approved')}
                                            className="flex items-center px-4 py-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                        >
                                            <Check className="w-4 h-4 mr-2" />
                                            Valider
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <img
                        src={selectedImage}
                        alt="Preuve grand format"
                        className="max-w-full max-h-full rounded-lg"
                    />
                    <button
                        className="absolute top-4 right-4 text-white hover:text-gray-300"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="w-8 h-8" />
                    </button>
                </div>
            )}
        </div>
    );
}
