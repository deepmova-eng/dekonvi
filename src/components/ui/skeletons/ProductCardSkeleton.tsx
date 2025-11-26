import React from 'react';
import '../../../premium-ui.css';

export default function ProductCardSkeleton() {
    return (
        <div className="product-card skeleton-loading">
            <div className="skeleton skeleton-image" />
            <div className="skeleton-content">
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text short" />
            </div>
        </div>
    );
}
