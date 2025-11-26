import React from 'react';

export const ProductCardSkeleton = () => {
    return (
        <div className="product-card skeleton">
            <div className="skeleton-image" />
            <div className="skeleton-content">
                <div className="skeleton-title" />
                <div className="skeleton-price" />
                <div className="skeleton-location" />
            </div>
        </div>
    );
};

export default ProductCardSkeleton;
