import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Star,
    MapPin,
    Calendar,
    Package,
    ArrowLeft,
    CheckCircle,
    TrendingUp,
    X,
    Upload,
    Info
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
    proof_image_url?: string;
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
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewFormData, setReviewFormData] = useState({
        rating: 5,
        comment: '',
        proofImage: null as File | null,
        proofImagePreview: ''
    });
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        if (id) {
            fetchSellerData();
        }
    }, [id, fetchSellerData]);


    const fetchSellerData = useCallback(async () => {
        try {
            setLoading(true);

            if (!id) {
                throw new Error('No seller ID provided');
            }

            // Fetch seller profile
            const { data: sellerData, error: sellerError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (sellerError) {
                console.error('Error fetching seller:', sellerError);
                throw sellerError;
            }
            setSeller(sellerData);

            // Fetch seller's active listings
            const { data: listingsData, error: listingsError } = await supabase
                .from('listings')
                .select('*')
                .eq('seller_id', id)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (listingsError) {
                console.error('Error fetching listings:', listingsError);
            }
            setListings(listingsData || []);

            // Fetch seller's reviews - simplified query without join
            const { data: reviewsData, error: reviewsError } = await supabase
                .from('reviews')
                .select('*')
                .eq('seller_id', id)
                .order('created_at', { ascending: false });

            if (reviewsError) {
                console.error('Error fetching reviews:', reviewsError);
            }
            setReviews(reviewsData || []);

        } catch (error) {
            console.error('Error fetching seller data:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const handleProofImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setReviewFormData({
                ...reviewFormData,
                proofImage: file,
                proofImagePreview: URL.createObjectURL(file)
            });
        }
    };

    const handleSubmitReview = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert('Vous devez être connecté pour laisser un avis');
            return;
        }

        if (!reviewFormData.proofImage) {
            alert('La photo preuve est obligatoire !');
            return;
        }

        if (!reviewFormData.comment.trim()) {
            alert('Le commentaire est obligatoire !');
            return;
        }

        try {
            setSubmittingReview(true);

            // Upload photo preuve
            const fileExt = reviewFormData.proofImage.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `reviews/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('reviews')
                .upload(filePath, reviewFormData.proofImage);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('reviews')
                .getPublicUrl(filePath);

            // Create review
            const { error: reviewError } = await supabase
                .from('reviews')
                .insert({
                    seller_id: id,
                    buyer_id: user.id,
                    rating: reviewFormData.rating,
                    comment: reviewFormData.comment,
                    proof_image_url: publicUrl,
                    status: 'pending' // En attente validation admin
                });

            if (reviewError) throw reviewError;

            alert('Votre avis a été soumis et sera visible après validation par notre équipe. Merci !');

            setShowReviewModal(false);
            setReviewFormData({
                rating: 5,
                comment: '',
                proofImage: null,
                proofImagePreview: ''
            });

        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Erreur lors de l\'envoi de l\'avis');
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
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
                    className="px-6 py-3 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors"
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

            {/* Hero Header - Transparent */}
            <div className="bg-transparent">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 mb-6 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span>Retour</span>
                    </button>

                    {/* Seller Info */}
                    <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">

                        {/* Avatar - Large */}
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center ring-4 ring-emerald-200 overflow-hidden">
                                {seller.avatar_url ? (
                                    <img
                                        src={seller.avatar_url}
                                        alt={seller.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-emerald-600 text-5xl font-bold">
                                        {seller.name?.[0]?.toUpperCase() || 'V'}
                                    </span>
                                )}
                            </div>

                            {/* Verified Badge */}
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center ring-4 ring-white shadow-lg">
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
                                                        ? 'text-yellow-500 fill-yellow-500'
                                                        : 'text-gray-300 fill-gray-300'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xl font-semibold text-gray-900">
                                            {averageRating.toFixed(1)}
                                        </span>
                                        <span className="text-gray-700">
                                            ({reviews.length} avis)
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                                {/* Stat 1 - Annonces */}
                                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-emerald-200">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <Package className="h-5 w-5 text-emerald-600" />
                                        <span className="text-2xl font-bold text-gray-900">{listings.length}</span>
                                    </div>
                                    <p className="text-sm text-gray-600">Annonces</p>
                                </div>

                                {/* Stat 2 - Membre depuis */}
                                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-emerald-200">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <Calendar className="h-5 w-5 text-emerald-600" />
                                        <span className="text-2xl font-bold text-gray-900">{memberSinceMonths}</span>
                                    </div>
                                    <p className="text-sm text-gray-600">Mois</p>
                                </div>

                                {/* Stat 3 - Taux réponse */}
                                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-emerald-200">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                                        <span className="text-2xl font-bold text-gray-900">{responseRate}%</span>
                                    </div>
                                    <p className="text-sm text-gray-600">Réponses</p>
                                </div>

                                {/* Stat 4 - Localisation */}
                                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-emerald-200">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <MapPin className="h-5 w-5 text-emerald-600" />
                                        <span className="text-lg font-bold text-gray-900 truncate">{seller.location || 'Lomé'}</span>
                                    </div>
                                    <p className="text-sm text-gray-600">Ville</p>
                                </div>

                            </div>

                            {/* Rating Display */}
                            <div className="mt-6">
                                {reviews.length > 0 ? (
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-6 w-6 ${i < Math.floor(averageRating)
                                                        ? 'text-yellow-400 fill-yellow-400'
                                                        : 'text-gray-300 fill-gray-300'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-2xl font-bold text-gray-900">
                                                {averageRating.toFixed(1)}
                                            </span>
                                            <span className="text-lg text-gray-500">
                                                ({reviews.length} {reviews.length > 1 ? 'avis' : 'avis'})
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2 text-gray-500">
                                        <Star className="h-5 w-5" />
                                        <span>Aucun avis pour le moment</span>
                                    </div>
                                )}
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

                {/* ═══════════════════════════════════════════════ */}
                {/* SECTION AVIS - ULTRA PREMIUM */}
                {/* ═══════════════════════════════════════════════ */}

                <section className="mb-16">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                Avis clients {reviews.length > 0 && `(${reviews.length})`}
                            </h2>
                            {reviews.length > 0 && (
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-5 w-5 ${i < Math.floor(averageRating)
                                                    ? 'text-yellow-400 fill-yellow-400'
                                                    : 'text-gray-300 fill-gray-300'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-2xl font-bold text-gray-900">
                                        {averageRating.toFixed(1)}
                                    </span>
                                    <span className="text-gray-500">sur 5</span>
                                </div>
                            )}
                        </div>

                        {/* Bouton Laisser un avis */}
                        <button
                            onClick={() => setShowReviewModal(true)}
                            className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-md"
                        >
                            <Star className="h-5 w-5" />
                            <span>Laisser un avis</span>
                        </button>
                    </div>

                    {/* Liste des avis */}
                    {reviews.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {reviews.map((review) => (
                                <div
                                    key={review.id}
                                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow"
                                >
                                    {/* Header avis - Acheteur + Date */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            {/* Avatar acheteur */}
                                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-gray-600 font-semibold text-lg">
                                                    {review.profiles?.name?.[0]?.toUpperCase() || 'A'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {review.profiles?.name || 'Acheteur vérifié'}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(review.created_at).toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Étoiles */}
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

                                    {/* Commentaire */}
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        {review.comment}
                                    </p>

                                    {/* Photo preuve - CRITIQUE */}
                                    {review.proof_image_url && (
                                        <div className="relative h-64 rounded-xl overflow-hidden group cursor-pointer">
                                            <img
                                                src={review.proof_image_url}
                                                alt="Photo du produit reçu"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                onClick={() => window.open(review.proof_image_url, '_blank')}
                                            />

                                            {/* Badge "Preuve vérifiée" */}
                                            <div className="absolute top-3 right-3 px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-full flex items-center space-x-1 shadow-lg">
                                                <CheckCircle className="h-3 w-3" />
                                                <span>Preuve vérifiée</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Empty state si 0 avis */
                        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                            <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Aucun avis pour le moment
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Soyez le premier à laisser un avis à ce vendeur !
                            </p>
                            <button
                                onClick={() => setShowReviewModal(true)}
                                className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                <Star className="h-5 w-5" />
                                <span>Laisser un avis</span>
                            </button>
                        </div>
                    )}
                </section>


            </div>

            {/* ═══════════════════════════════════════════════ */}
            {/* MODAL LAISSER UN AVIS */}
            {/* ═══════════════════════════════════════════════ */}

            {showReviewModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 pt-20">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">

                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-gray-900">
                                Laisser un avis à {seller?.name}
                            </h3>
                            <button
                                onClick={() => setShowReviewModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="h-6 w-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">

                            {/* Note */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-3">
                                    Votre note *
                                </label>
                                <div className="flex items-center space-x-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setReviewFormData({ ...reviewFormData, rating: star })}
                                            className="focus:outline-none"
                                        >
                                            <Star
                                                className={`h-10 w-10 cursor-pointer transition-colors ${star <= reviewFormData.rating
                                                    ? 'text-yellow-400 fill-yellow-400'
                                                    : 'text-gray-300 hover:text-yellow-200'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                    <span className="ml-3 text-2xl font-bold text-gray-900">
                                        {reviewFormData.rating}.0
                                    </span>
                                </div>
                            </div>

                            {/* Commentaire */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Votre commentaire *
                                </label>
                                <textarea
                                    value={reviewFormData.comment}
                                    onChange={(e) => setReviewFormData({ ...reviewFormData, comment: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                                    placeholder="Décrivez votre expérience avec ce vendeur..."
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    {reviewFormData.comment.length} caractères
                                </p>
                            </div>

                            {/* Photo preuve - OBLIGATOIRE */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Photo du produit reçu * (Preuve obligatoire)
                                </label>
                                <p className="text-sm text-gray-600 mb-3">
                                    Prenez une photo du produit que vous avez acheté. Cette preuve sera vérifiée par notre équipe avant publication de votre avis.
                                </p>

                                {/* Upload zone */}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProofImageChange}
                                        className="hidden"
                                        id="proof-image-upload"
                                    />
                                    <label htmlFor="proof-image-upload" className="cursor-pointer">
                                        {reviewFormData.proofImagePreview ? (
                                            <div className="relative">
                                                <img
                                                    src={reviewFormData.proofImagePreview}
                                                    alt="Preview"
                                                    className="max-h-64 mx-auto rounded-lg"
                                                />
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setReviewFormData({
                                                            ...reviewFormData,
                                                            proofImage: null,
                                                            proofImagePreview: ''
                                                        });
                                                    }}
                                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                                <p className="text-gray-700 font-medium mb-1">
                                                    Cliquez pour ajouter une photo
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    JPG, PNG ou WEBP - Max 5MB
                                                </p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Info validation */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
                                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-900">
                                    <p className="font-semibold mb-1">Validation manuelle</p>
                                    <p>
                                        Votre avis sera vérifié par notre équipe avant d'être publié. Nous nous assurons que la photo correspond bien au produit acheté. Comptez 24-48h pour la validation.
                                    </p>
                                </div>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end space-x-4">
                            <button
                                onClick={() => setShowReviewModal(false)}
                                className="px-6 py-3 text-gray-700 font-semibold hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSubmitReview}
                                disabled={submittingReview || !reviewFormData.proofImage || !reviewFormData.comment.trim()}
                                className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                            >
                                {submittingReview ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                        <span>Envoi...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-5 w-5" />
                                        <span>Soumettre l'avis</span>
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
