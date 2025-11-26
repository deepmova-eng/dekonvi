import React, { useEffect, useState } from 'react';
import { Star, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    reviewer: {
        name: string;
        avatar_url: string | null;
    };
}

interface ReviewListProps {
    sellerId: string;
    refreshTrigger?: number;
}

export default function ReviewList({ sellerId, refreshTrigger }: ReviewListProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const { data, error } = await supabase
                    .from('reviews')
                    .select(`
            id,
            rating,
            comment,
            created_at,
            reviewer:reviewer_id (
              name,
              avatar_url
            )
          `)
                    .eq('seller_id', sellerId)
                    .eq('status', 'approved')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Transform data to match interface (Supabase returns array for joined relation)
                const formattedReviews = (data || []).map((item: any) => ({
                    id: item.id,
                    rating: item.rating,
                    comment: item.comment,
                    created_at: item.created_at,
                    reviewer: Array.isArray(item.reviewer) ? item.reviewer[0] : item.reviewer,
                }));

                setReviews(formattedReviews);
            } catch (error) {
                console.error('Error fetching reviews:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [sellerId, refreshTrigger]);

    if (loading) {
        return <div className="text-center py-4 text-gray-500">Chargement des avis...</div>;
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Aucun avis pour le moment.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Avis ({reviews.length})</h3>
            {reviews.map((review) => (
                <div key={review.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                {review.reviewer?.avatar_url ? (
                                    <img
                                        src={review.reviewer.avatar_url}
                                        alt={review.reviewer.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <User className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    {review.reviewer?.name || 'Utilisateur'}
                                </p>
                                <div className="flex items-center space-x-2">
                                    <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {formatDistanceToNow(new Date(review.created_at), {
                                            addSuffix: true,
                                            locale: fr,
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {review.comment && (
                        <p className="mt-3 text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                    )}
                </div>
            ))}
        </div>
    );
}
