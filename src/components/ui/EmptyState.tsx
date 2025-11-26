import React from 'react';
import { LucideIcon } from 'lucide-react';
import '../../premium-ui.css';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">
                <Icon />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="bg-primary-500 text-white px-6 py-2 rounded-full hover:bg-primary-600 transition-colors font-medium btn"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
