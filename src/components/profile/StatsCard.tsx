import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    iconColor?: string;
    bgColor?: string;
}

export default function StatsCard({
    icon: Icon,
    label,
    value,
    iconColor = 'text-primary-600',
    bgColor = 'bg-primary-100'
}: StatsCardProps) {
    return (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
                <div className={`${bgColor} p-3 rounded-full`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-sm text-gray-500">{label}</p>
                </div>
            </div>
        </div>
    );
}
