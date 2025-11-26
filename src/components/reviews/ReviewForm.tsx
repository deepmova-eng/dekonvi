import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { useSupabase } from '../../contexts/SupabaseContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ReviewFormProps {
    sellerId: string;
    listingId?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function ReviewForm({ sellerId, listingId, onSuccess, onCancel }: ReviewFormProps) {
    const { user } = useSupabase();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [proofImage, setProofImage] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string | null>(null);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProofImage(file);
            setProofPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (rating === 0) {
            toast.error('Veuillez sélectionner une note');
            return;
        }
        if (!proofImage) {
            toast.error("Une preuve d'achat est requise");
            return;
        }

        let proofUrl: string | null = null; // Declare proofUrl outside try block for fallback access

        setSubmitting(true);
        try {
            // Upload proof image
            const fileExt = proofImage.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            // Upload with timeout
            const uploadPromise = supabase.storage
                .from('review-proofs')
                .upload(filePath, proofImage);

            const uploadTimeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Upload timeout')), 10000)
            );

            const { error: uploadError } = await Promise.race([
                uploadPromise,
                uploadTimeoutPromise
            ]) as any;

            if (uploadError) throw uploadError;

            proofUrl = filePath; // Assign to the outer-scoped variable

            // Insert review with timeout
            const dbTimeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Query timeout')), 3000)
            );

            const insertData = {
                reviewer_id: user.id,
                seller_id: sellerId,
                listing_id: listingId || null,
                rating,
                comment: comment.trim() || null,
                status: 'pending',
                proof_image_url: proofUrl
            };

            const insertQuery = supabase.from('reviews').insert(insertData);

            const { error } = await Promise.race([
                insertQuery,
                dbTimeoutPromise
            ]) as any;

            if (error) throw error;

            toast.success('Avis soumis à validation !');
            onSuccess();
        } catch (error) {
            console.error('Error submitting review:', error);

            // Fallback to REST API for DB insert
            if (error instanceof Error && error.message === 'Query timeout') {
                console.log('[ReviewForm] insert timed out, using REST API fallback...');
                try {
                    if (!proofUrl) {
                        throw new Error("Proof URL not available for fallback after upload timeout.");
                    }

                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

                    const fallbackInsertData = {
                        reviewer_id: user.id,
                        seller_id: sellerId,
                        listing_id: listingId || null,
                        rating,
                        comment: comment.trim() || null,
                        status: 'pending',
                        proof_image_url: proofUrl
                    };

                    const response = await fetch(`${supabaseUrl}/rest/v1/reviews`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': supabaseAnonKey,
                            'Authorization': `Bearer ${supabaseAnonKey}` // Use anon key for direct REST if user token fails
                        },
                        body: JSON.stringify(fallbackInsertData)
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`REST API fallback failed: ${JSON.stringify(errorData)}`);
                    }

                    toast.success('Avis soumis à validation via fallback !');
                    onSuccess();
                    return; // Exit after successful fallback
                } catch (fallbackError) {
                    console.error('Error during REST API fallback:', fallbackError);
                    toast.error("Échec de l'envoi de l'avis, même avec le fallback.");
                    // Continue to generic error handling if fallback also fails
                }
            }

            if (error instanceof Error && (error as any).code === '23505') {
                toast.error('Vous avez déjà laissé un avis pour cet article/vendeur');
            } else {
                toast.error("Erreur lors de l'envoi de l'avis");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 relative animate-fade-in max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X className="w-6 h-6" />
                </button>

                <h2 className="text-xl font-bold mb-4">Noter le vendeur</h2>
                <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm mb-4">
                    Pour garantir l'authenticité des avis, une preuve d'achat est requise. Votre avis sera visible après validation par un administrateur.
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col items-center space-y-2">
                        <div className="flex space-x-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`w-8 h-8 ${star <= (hoveredRating || rating)
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-gray-500">
                            {rating > 0 ? `${rating}/5 étoiles` : 'Sélectionnez une note'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Preuve d'achat (Photo du produit, ticket...) *
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-500 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="space-y-1 text-center">
                                {proofPreview ? (
                                    <img src={proofPreview} alt="Preuve" className="mx-auto h-32 object-contain" />
                                ) : (
                                    <>
                                        <svg
                                            className="mx-auto h-12 w-12 text-gray-400"
                                            stroke="currentColor"
                                            fill="none"
                                            viewBox="0 0 48 48"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                                strokeWidth={2}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        <div className="flex text-sm text-gray-600">
                                            <span className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                                Télécharger un fichier
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">PNG, JPG jusqu'à 5MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Commentaire (optionnel)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Partagez votre expérience avec ce vendeur..."
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                            disabled={submitting}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || rating === 0 || !proofImage}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Envoi...' : 'Soumettre'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
