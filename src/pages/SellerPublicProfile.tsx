import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSellerProfile } from '../hooks/useProfile';
import { useSellerListings } from '../hooks/useListings';
import { useSellerReviews, useSubmitReview } from '../hooks/useReviews';
import { useSellerResponseRate } from '../hooks/useSellerResponseRate';
import {
    Star,
    MapPin,
    Calendar,
    Package,
    ChevronLeft,
    CheckCircle,
    TrendingUp,
    X,
    Upload,
    Info,
    Check,
    Flag
} from 'lucide-react';
import ProductCard from '../components/home/ProductCard';
import ReportModal from '../components/shared/ReportModal';

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
    reviewer_id: string;
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

// Component for review comment with text clamping
function ReviewComment({ comment }: { comment: string }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const isLongComment = comment.length > 200; // ~4 lines at 50 chars/line

    return (
        <div className="mb-4">
            <p className={`text-gray-700 leading-relaxed ${!isExpanded && isLongComment ? 'line-clamp-4' : ''}`}>
                {comment}
            </p>
            {isLongComment && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-emerald-600 hover:text-emerald-700 text-sm font-medium mt-1 transition-colors"
                >
                    {isExpanded ? 'Voir moins' : 'Voir plus'}
                </button>
            )}
        </div>
    );
}

export default function SellerPublicProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // ✅ React Query hooks - remplace tout le code useEffect ci-dessus
    const { data: seller, isLoading: sellerLoading } = useSellerProfile(id);
    const { data: listings = [], isLoading: listingsLoading } = useSellerListings(id);
    const { data: reviews = [], isLoading: reviewsLoading } = useSellerReviews(id);
    const { data: responseRate, isLoading: responseRateLoading } = useSellerResponseRate(id);

    const loading = sellerLoading || listingsLoading || reviewsLoading;

    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [reviewFormData, setReviewFormData] = useState({
        rating: 5,
        comment: '',
        proofImage: null as File | null,
        proofImagePreview: ''
    });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);


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

            // ✅ OPTIMISER l'image AVANT upload (800px, WebP, quality 0.7)
            const { optimizeImage, OPTIMIZE_PRESETS } = await import('../utils/imageOptimizer');
            const optimizedFile = await optimizeImage(reviewFormData.proofImage, OPTIMIZE_PRESETS.REVIEW_PROOF);

            // 1. Générer un nom de fichier PROPRE (TOUJOURS .webp)
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.webp`;
            const filePath = `${fileName}`; // À la racine du bucket

            console.log('🔼 Tentative Upload vers : review-proofs /', filePath);

            // 2. Upload vers le BON bucket (review-proofs)
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('review-proofs') // ⚠️ CORRIGÉ: était 'reviews'
                .upload(filePath, optimizedFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('❌ Erreur Upload Storage:', uploadError);
                throw uploadError;
            }

            console.log('✅ Upload réussi:', uploadData);

            // 3. Récupérer l'URL publique
            const { data: { publicUrl } } = supabase.storage
                .from('review-proofs')
                .getPublicUrl(filePath);

            console.log('🔗 URL publique:', publicUrl);

            // Create review
            const { error: reviewError } = await supabase
                .from('reviews')
                .insert({
                    seller_id: id,
                    reviewer_id: user.id, // ⚠️ CORRIGÉ: était 'buyer_id'
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

    // Response rate now calculated via useSellerResponseRate hook
    const memberSinceMonths = Math.floor(
        (new Date().getTime() - new Date(seller.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    // Format member since text
    const getMemberSinceText = () => {
        if (memberSinceMonths < 1) {
            return "Nouveau membre";
        }
        return `${memberSinceMonths} Mois`;
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">

            {/* Clean Header - Just Back Button + Report */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeft className="h-6 w-6" />
                        <span className="font-medium">Retour</span>
                    </button>

                    <button
                        onClick={() => setShowReportModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                        title="Signaler ce vendeur"
                    >
                        <Flag className="h-5 w-5" />
                        <span className="text-sm font-medium hidden sm:inline">Signaler</span>
                    </button>
                </div>
            </div>

            {/* Hero Header */}
            <div className="bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

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
                            <div className="mb-6">
                                <h1 className="text-3xl font-bold mb-3">{seller.name}</h1>

                                {reviews.length > 0 && (
                                    <div className="flex items-center space-x-2">
                                        <div className="flex items-center space-x-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-4 w-4 ${i < Math.floor(averageRating)
                                                        ? 'text-yellow-400 fill-yellow-400'
                                                        : 'text-gray-300 fill-gray-300'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-base font-semibold text-gray-900">
                                            {averageRating.toFixed(1)}
                                        </span>
                                        <span className="text-gray-500 text-sm">
                                            ({reviews.length} avis)
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                                {/* Stat 1 - Annonces */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <Package className="h-6 w-6 text-gray-600" />
                                        <span className="text-xl font-bold text-gray-900">{listings.length}</span>
                                    </div>
                                    <p className="text-xs text-gray-600">Annonces</p>
                                </div>

                                {/* Stat 2 - Membre depuis */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <Calendar className="h-6 w-6 text-gray-600" />
                                        <span className="text-xl font-bold text-gray-900">
                                            {memberSinceMonths < 1 ? "✨" : memberSinceMonths}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600">{getMemberSinceText()}</p>
                                </div>

                                {/* Stat 3 - Taux réponse */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <TrendingUp className="h-6 w-6 text-gray-600" />
                                        <span className="text-xl font-bold text-gray-900">
                                            {responseRate !== null && responseRate !== undefined ? `${responseRate}%` : 'N/A'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600">Réponse</p>
                                </div>

                                {/* Stat 4 - Localisation */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <MapPin className="h-6 w-6 text-gray-600" />
                                        <span className="text-base font-bold text-gray-900 whitespace-normal break-words leading-tight">
                                            {seller.location || '--'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600">Ville</p>
                                </div>

                            </div>

                            {/* SUPPRIMÉ : Duplicate Rating Display */}

                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Annonces Section - Style Vinted */}
                <section className="mb-16">
                    <div className="flex items-center justify-between mb-6" style={{ marginTop: '32px' }}>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Annonces actives ({listings.length})
                        </h2>
                    </div>

                    {listings.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
                                <div className="flex flex-wrap items-center gap-2">
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
                                    <span className="text-2xl font-bold text-gray-900 whitespace-nowrap">
                                        {averageRating.toFixed(1)}
                                    </span>
                                    <span className="text-gray-500 whitespace-nowrap">sur 5</span>
                                </div>
                            )}
                        </div>

                        {/* Bouton Laisser un avis - Outline Style */}
                        <button
                            onClick={() => setShowReviewModal(true)}
                            className="flex items-center space-x-2 px-5 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors text-sm"
                        >
                            <Star className="h-4 w-4" />
                            <span>Laisser un avis</span>
                        </button>
                    </div>

                    {/* Liste des avis - Vertical List (Amazon/Vinted style) */}
                    {reviews.length > 0 ? (
                        <>
                            <div className="flex flex-col">
                                {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => (
                                    <div
                                        key={review.id}
                                        className="py-6 border-b border-gray-200 last:border-b-0"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            {/* Left side - Main content */}
                                            <div className="flex-1 min-w-0">
                                                {/* Header avis - Acheteur + Date + Étoiles */}
                                                <div className="flex items-start gap-4 mb-3">
                                                    {/* Avatar acheteur */}
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-gray-600 font-semibold text-base">
                                                            {review.profiles?.name?.[0]?.toUpperCase() || 'A'}
                                                        </span>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <p className="font-semibold text-gray-900">
                                                                {review.profiles?.name || 'Acheteur vérifié'}
                                                            </p>
                                                            {/* Étoiles inline */}
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
                                                        <p className="text-sm text-gray-500">
                                                            {new Date(review.created_at).toLocaleDateString('fr-FR', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Commentaire avec line-clamp */}
                                                <ReviewComment comment={review.comment} />
                                            </div>

                                            {/* Right side - Photo preuve (thumbnail compact) */}
                                            {review.proof_image_url && (
                                                <div className="relative w-20 h-20 rounded-lg overflow-hidden group cursor-pointer flex-shrink-0">
                                                    <img
                                                        src={review.proof_image_url}
                                                        alt="Photo du produit reçu"
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                        onClick={() => window.open(review.proof_image_url, '_blank')}
                                                    />

                                                    {/* Badge "Preuve vérifiée" */}
                                                    <div className="absolute bottom-1 right-1 bg-green-500 rounded-full p-1 shadow-md border-2 border-white">
                                                        <Check className="h-3 w-3 text-white" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Button to show all reviews if > 3 */}
                            {reviews.length > 3 && !showAllReviews && (
                                <div className="text-center mt-6">
                                    <button
                                        onClick={() => setShowAllReviews(true)}
                                        className="px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                                    >
                                        Voir les {reviews.length} avis
                                    </button>
                                </div>
                            )}
                        </>
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 pt-20 pb-24">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">

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
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 pb-8 flex items-center justify-end space-x-4">
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

            {/* Report Modal */}
            {showReportModal && (
                <ReportModal
                    targetType="user"
                    targetId={id!}
                    targetName={seller?.name || 'Ce vendeur'}
                    onClose={() => setShowReportModal(false)}
                />
            )}
        </div>
    );
}
