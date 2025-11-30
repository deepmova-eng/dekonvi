import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Star,
    MapPin,
    Calendar,
    Package,
    MessageCircle,
    Phone,
    ArrowLeft,
    CheckCircle,
    TrendingUp
} from 'lucide-react';
import ProductCard from '../components/home/ProductCard';

interface SellerProfile {
    id: string;
    name: string;
    avatar_url: string | null;
    location: string;
    phone: string | null;
    created_at: string;
}

interface Review {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    buyer_id: string;
    profiles?: {
        name: string;
    };
}

interface Listing {
    id: string;
    title: string;
    price: number;
    images: string[];
    location: string;
    created_at: string;
    condition: string;
    category: string;
}

export default function SellerPublicProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [seller, setSeller] = useState<SellerProfile | null>(null);
    const [listings, setListings] = useState<Listing[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPhone, setShowPhone] = useState(false);

    useEffect(() => {
        if (id) {
            fetchSellerData();
        }
    }, [id]);

    const fetchSellerData = async () => {
        try {
            setLoading(true);

            // Fetch seller profile
            const { data: sellerData, error: sellerError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (sellerError) throw sellerError;
            setSeller(sellerData);

            // Fetch seller's active listings
            const { data: listingsData, error: listingsError } = await supabase
                .from('listings')
                .select('*')
                .eq('seller_id', id)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (listingsError) throw listingsError;
            setListings(listingsData || []);

            // Fetch seller's reviews
            const { data: reviewsData, error: reviewsError } = await supabase
                .from('reviews')
                .select(`
          id,
          rating,
          comment,
          created_at,
          buyer_id,
          profiles:buyer_id (
            name
          )
        `)
                .eq('seller_id', id)
                .order('created_at', { ascending: false });

            if (reviewsError) throw reviewsError;
            setReviews(reviewsData || []);

        } catch (error) {
            console.error('Error fetching seller data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    if (!seller) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Vendeur introuvable</h2>
                <p className="text-gray-600 mb-6">Ce profil n'existe pas ou a été supprimé.</p>
                <button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
                >
                    Retour à l'accueil
                </button>
            </div>
        );
    }

    const averageRating = reviews.length > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        : 0;

    const responseRate = 95; // TODO: Calculate from messaging data
    const memberSinceMonths = Math.floor(
        (new Date().getTime() - new Date(seller.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Hero Header - Ultra Premium */}
            <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center space-x-2 text-white/90 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span>Retour</span>
                    </button>

                    {/* Seller Info */}
                    <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">

                        {/* Avatar - Large */}
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/30 overflow-hidden">
                                {seller.avatar_url ? (
                                    <img
                                        src={seller.avatar_url}
                                        alt={seller.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-white text-5xl font-bold">
                                        {seller.name?.[0]?.toUpperCase() || 'V'}
                                    </span>
                                )}
                            </div>

                            {/* Verified Badge */}
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center ring-4 ring-white shadow-lg">
                                <CheckCircle className="w-7 h-7 text-white" />
                            </div>
                        </div>

                        {/* Info + Stats */}
                        <div className="flex-1">
                            {/* Name + Rating */}
                            <div className="mb-4">
                                <h1 className="text-4xl font-bold mb-2">{seller.name}</h1>

                                {reviews.length > 0 && (
                                    <div className="flex items-center space-x-3">
                                        <div className="flex items-center space-x-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-5 w-5 ${i < Math.floor(averageRating)
                                                            ? 'text-yellow-300 fill-yellow-300'
                                                            : 'text-white/30 fill-white/30'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xl font-semibold">
                                            {averageRating.toFixed(1)}
                                        </span>
                                        <span className="text-white/80">
                                            ({reviews.length} avis)
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                                {/* Stat 1 - Annonces */}
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <Package className="h-5 w-5 text-white/80" />
                                        <span className="text-2xl font-bold">{listings.length}</span>
                                    </div>
                                    <p className="text-sm text-white/70">Annonces</p>
                                </div>

                                {/* Stat 2 - Membre depuis */}
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <Calendar className="h-5 w-5 text-white/80" />
                                        <span className="text-2xl font-bold">{memberSinceMonths}</span>
                                    </div>
                                    <p className="text-sm text-white/70">Mois</p>
                                </div>

                                {/* Stat 3 - Taux réponse */}
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <TrendingUp className="h-5 w-5 text-white/80" />
                                        <span className="text-2xl font-bold">{responseRate}%</span>
                                    </div>
                                    <p className="text-sm text-white/70">Réponses</p>
                                </div>

                                {/* Stat 4 - Localisation */}
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <MapPin className="h-5 w-5 text-white/80" />
                                        <span className="text-lg font-bold truncate">{seller.location || 'Lomé'}</span>
                                    </div>
                                    <p className="text-sm text-white/70">Ville</p>
                                </div>

                            </div>

                            {/* Contact Buttons */}
                            <div className="flex flex-wrap gap-3 mt-6">

                                {/* Phone */}
                                {seller.phone && (
                                    <button
                                        onClick={() => setShowPhone(!showPhone)}
                                        className="flex items-center space-x-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-full hover:bg-white/30 transition-colors border-2 border-white/30"
                                    >
                                        <Phone className="h-5 w-5" />
                                        <span>{showPhone ? seller.phone : 'Afficher le numéro'}</span>
                                    </button>
                                )}

                                {/* Message */}
                                <button
                                    className="flex items-center space-x-2 px-6 py-3 bg-white text-primary-600 font-semibold rounded-full hover:bg-primary-50 transition-colors shadow-lg"
                                >
                                    <MessageCircle className="h-5 w-5" />
                                    <span>Envoyer un message</span>
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Annonces Section */}
                <section className="mb-16">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">
                            Annonces actives ({listings.length})
                        </h2>
                    </div>

                    {listings.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {listings.map((listing) => (
                                <ProductCard key={listing.id} listing={listing} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
                            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Aucune annonce active
                            </h3>
                            <p className="text-gray-600">
                                Ce vendeur n'a pas d'annonces en ce moment.
                            </p>
                        </div>
                    )}
                </section>

                {/* Reviews Section */}
                {reviews.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-bold text-gray-900">
                                Avis clients ({reviews.length})
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {reviews.map((review) => (
                                <div
                                    key={review.id}
                                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                                >
                                    {/* Review Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {review.profiles?.name || 'Acheteur'}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(review.created_at).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>

                                        {/* Stars */}
                                        <div className="flex items-center space-x-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-4 w-4 ${i < review.rating
                                                            ? 'text-yellow-400 fill-yellow-400'
                                                            : 'text-gray-300 fill-gray-300'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Comment */}
                                    <p className="text-gray-700 leading-relaxed">
                                        {review.comment}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

            </div>
        </div>
    );
}
