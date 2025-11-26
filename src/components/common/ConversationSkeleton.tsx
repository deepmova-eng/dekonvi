import React from 'react';

export const ConversationSkeleton = () => {
    return (
        <div className="conversation-item skeleton">
            <div className="skeleton-avatar" />
            <div className="skeleton-content">
                <div className="skeleton-name" />
                <div className="skeleton-message" />
            </div>
        </div>
    );
};

export default ConversationSkeleton;
