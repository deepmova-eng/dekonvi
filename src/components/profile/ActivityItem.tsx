import { Package, Star, Zap, MessageSquare } from 'lucide-react';
import { Activity, ActivityType } from '../../hooks/useUserActivity';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActivityItemProps {
    activity: Activity;
}

const iconMap: Record<ActivityType, { icon: any; color: string; bgColor: string }> = {
    listing_created: {
        icon: Package,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
    },
    review_received: {
        icon: Star,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100'
    },
    premium_requested: {
        icon: Zap,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100'
    },
    listing_updated: {
        icon: MessageSquare,
        color: 'text-green-600',
        bgColor: 'bg-green-100'
    }
};

export default function ActivityItem({ activity }: ActivityItemProps) {
    const { icon: Icon, color, bgColor } = iconMap[activity.type];

    const timeAgo = formatDistanceToNow(new Date(activity.timestamp), {
        addSuffix: true,
        locale: fr
    });

    return (
        <div className="flex gap-4 p-4 hover:bg-gray-50 transition-colors rounded-lg">
            <div className={`${bgColor} p-2 rounded-full h-fit`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm">{activity.title}</h4>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-2">{timeAgo}</p>
            </div>
        </div>
    );
}
