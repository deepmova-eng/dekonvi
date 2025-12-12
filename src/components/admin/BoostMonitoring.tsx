import { useState, useEffect } from 'react';
import { Zap, Clock, TrendingUp, DollarSign, Crown, AlertCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface BoostListing {
    id: string;
    title: string;
    images: string[];
    seller_id: string;
    seller_name: string;
    package_name: string;
    premium_until: string;
    amount: number;
}

interface TickerData {
    listing_id: string | null;
    listing_title: string | null;
    owner_name: string | null;
    claimed_at: string | null;
}

export default function BoostMonitoring() {
    const [activeBoosts, setActiveBoosts] = useState<BoostListing[]>([]);
    const [tickerData, setTickerData] = useState<TickerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalActive: 0,
        totalRevenue: 0,
        expiringSoon: 0,
    });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [selectedBoost, setSelectedBoost] = useState<BoostListing | null>(null);
    const [removing, setRemoving] = useState(false);

    // Fetch active boosts
    const fetchActiveBoosts = async () => {
        try {
            const { data, error } = await supabase
                .rpc('get_active_boosts_admin' as any);

            if (error) throw error;

            const boostsData = (data as BoostListing[]) || [];
            setActiveBoosts(boostsData);

            // Calculate stats
            const now = new Date();
            const expiringSoon = boostsData.filter((boost) => {
                const expiresAt = new Date(boost.premium_until);
                const hoursRemaining = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
                return hoursRemaining < 24 && hoursRemaining > 0;
            }).length;

            const totalRevenue = boostsData.reduce((sum, boost) => sum + boost.amount, 0);

            setStats({
                totalActive: boostsData.length,
                totalRevenue,
                expiringSoon,
            });
        } catch (error) {
            console.error('Error fetching boosts:', error);
            toast.error('Erreur lors du chargement des boosts');
        } finally {
            setLoading(false);
        }
    };

    // Fetch ticker data
    const fetchTickerData = async () => {
        try {
            const { data, error } = await supabase
                .from('ticker_spot')
                .select(`
                    current_listing_id,
                    claimed_at,
                    listings:current_listing_id(title),
                    profiles:owner_id(name)
                `)
                .single();

            if (error) throw error;

            if (data) {
                setTickerData({
                    listing_id: (data as any).current_listing_id,
                    listing_title: (data as any).listings?.title || null,
                    owner_name: (data as any).profiles?.name || null,
                    claimed_at: (data as any).claimed_at,
                });
            }
        } catch (error) {
            console.error('Error fetching ticker:', error);
        }
    };

    useEffect(() => {
        fetchActiveBoosts();
        fetchTickerData();

        // Refresh every 30 seconds
        const interval = setInterval(() => {
            fetchActiveBoosts();
            fetchTickerData();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // Format countdown
    const getTimeRemaining = (premiumUntil: string) => {
        const now = new Date();
        const expiresAt = new Date(premiumUntil);
        const diff = expiresAt.getTime() - now.getTime();

        if (diff <= 0) return 'Expiré';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}j ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    // Get status badge
    const getStatusBadge = (premiumUntil: string) => {
        const now = new Date();
        const expiresAt = new Date(premiumUntil);
        const hoursRemaining = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursRemaining < 0) {
            return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">Expiré</span>;
        } else if (hoursRemaining < 24) {
            return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">Expire bientôt</span>;
        } else {
            return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Actif</span>;
        }
    };

    // Handle boost removal
    const handleRemoveBoost = async () => {
        if (!selectedBoost) return;

        setRemoving(true);
        const toastId = toast.loading('Retrait du boost en cours...');

        try {
            const { error } = await supabase.rpc('admin_expire_boost' as any, {
                p_listing_id: selectedBoost.id,
                p_reason: 'Manuel - Admin panel'
            });

            if (error) throw error;

            toast.success('Boost retiré avec succès !', { id: toastId });

            // Refresh data
            await fetchActiveBoosts();

            // Close dialog
            setShowConfirmDialog(false);
            setSelectedBoost(null);
        } catch (error: any) {
            console.error('Error removing boost:', error);
            toast.error(error.message || 'Erreur lors du retrait du boost', { id: toastId });
        } finally {
            setRemoving(false);
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
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Boosts Actifs</p>
                            <p className="text-3xl font-bold mt-2">{stats.totalActive}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-lg">
                            <Zap className="w-8 h-8" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Revenus Total</p>
                            <p className="text-3xl font-bold mt-2">{stats.totalRevenue.toLocaleString()} F</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-lg">
                            <DollarSign className="w-8 h-8" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-medium">Expirent &lt; 24h</p>
                            <p className="text-3xl font-bold mt-2">{stats.expiringSoon}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-lg">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Ticker Star Section */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <Crown className="w-6 h-6" />
                    <h3 className="text-xl font-bold">Ticker Star - King of the Hill</h3>
                </div>
                {tickerData?.listing_id ? (
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-yellow-100 text-sm">Annonce</p>
                                <p className="font-semibold mt-1">{tickerData.listing_title}</p>
                            </div>
                            <div>
                                <p className="text-yellow-100 text-sm">Propriétaire</p>
                                <p className="font-semibold mt-1">{tickerData.owner_name}</p>
                            </div>
                            <div>
                                <p className="text-yellow-100 text-sm">Depuis</p>
                                <p className="font-semibold mt-1">
                                    {tickerData.claimed_at
                                        ? new Date(tickerData.claimed_at).toLocaleDateString('fr-FR')
                                        : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                        <p className="text-yellow-100">Aucune annonce dans le ticker actuellement</p>
                    </div>
                )}
            </div>

            {/* Active Boosts Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary-500" />
                        Boosts Actifs
                    </h3>
                </div>

                {activeBoosts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Aucun boost actif pour le moment
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Annonce
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Vendeur
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Package
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Temps Restant
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Expire Le
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {activeBoosts.map((boost) => (
                                    <tr key={boost.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {boost.images?.[0] && (
                                                    <img
                                                        src={boost.images[0]}
                                                        alt={boost.title}
                                                        className="w-12 h-12 rounded-lg object-cover"
                                                    />
                                                )}
                                                <span className="font-medium text-gray-900 max-w-xs truncate">
                                                    {boost.title}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {boost.seller_name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                                {boost.package_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                                <Clock className="w-4 h-4 text-primary-500" />
                                                {getTimeRemaining(boost.premium_until)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(boost.premium_until).toLocaleString('fr-FR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(boost.premium_until)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => {
                                                    setSelectedBoost(boost);
                                                    setShowConfirmDialog(true);
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
                                                title="Retirer le boost"
                                            >
                                                <X className="w-4 h-4" />
                                                Retirer
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Confirmation Dialog */}
            {showConfirmDialog && selectedBoost && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            Retirer ce boost ?
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Vous êtes sur le point de retirer le boost de l'annonce{' '}
                            <span className="font-semibold">"{selectedBoost.title}"</span>.
                        </p>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-orange-800">
                                ⚠️ L'annonce ne sera plus affichée dans "À la Une" et sera retournée aux annonces normales.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowConfirmDialog(false);
                                    setSelectedBoost(null);
                                }}
                                disabled={removing}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleRemoveBoost}
                                disabled={removing}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {removing ? 'Retrait...' : 'Confirmer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
