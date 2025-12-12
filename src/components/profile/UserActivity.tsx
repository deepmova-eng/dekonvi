import { Package, Star, TrendingUp, Zap } from 'lucide-react';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { useUserStats } from '../../hooks/useUserStats';
import { useUserActivity } from '../../hooks/useUserActivity';
import StatsCard from './StatsCard';
import ActivityItem from './ActivityItem';

export default function UserActivity() {
    const { user } = useSupabaseAuth();
    const { stats, loading: statsLoading } = useUserStats(user?.id);
    const { activities, loading: activitiesLoading } = useUserActivity(user?.id);

    const loading = statsLoading || activitiesLoading;    // Loading handled by PageLoader
    if (loading) {
        return null;
    }

    const hasActivity = activities.length > 0;

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    icon={Package}
                    label="Annonces actives"
                    value={stats.activeListings}
                    iconColor="text-blue-600"
                    bgColor="bg-blue-100"
                />
                <StatsCard
                    icon={TrendingUp}
                    label="Total annonces"
                    value={stats.totalListings}
                    iconColor="text-green-600"
                    bgColor="bg-green-100"
                />
                <StatsCard
                    icon={Star}
                    label="Note moyenne"
                    value={stats.totalReviews > 0 ? stats.averageRating.toFixed(1) : '—'}
                    iconColor="text-yellow-600"
                    bgColor="bg-yellow-100"
                />
                <StatsCard
                    icon={Zap}
                    label="Premium en attente"
                    value={stats.pendingPremiumRequests}
                    iconColor="text-amber-600"
                    bgColor="bg-amber-100"
                />
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Activité récente</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Vos transactions, annonces et avis
                    </p>
                </div>

                <div className="divide-y divide-gray-100">
                    {hasActivity ? (
                        activities.map((activity) => (
                            <ActivityItem key={activity.id} activity={activity} />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <TrendingUp className="w-8 h-8 text-gray-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                Aucune activité récente
                            </h4>
                            <p className="text-gray-500 text-center max-w-md text-sm">
                                Publiez des annonces et interagissez pour voir votre activité ici
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
