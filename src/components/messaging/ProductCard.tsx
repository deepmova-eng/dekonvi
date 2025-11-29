import React from 'react'

interface ProductCardProps {
    listing: {
        id: string
        title: string
        price: number
        images?: string[]
        condition?: string
        location?: string
    }
}

export function ProductCard({ listing }: ProductCardProps) {
    const handleClick = () => {
        window.location.href = `/listings/${listing.id}`
    }

    return (
        <div
            className="bg-white px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={handleClick}
        >
            <div className="flex items-center gap-3">
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                    <img
                        src={listing.images?.[0] || '/placeholder.png'}
                        alt={listing.title}
                        className="w-16 h-16 md:w-16 md:h-16 sm:w-14 sm:h-14 rounded-lg object-cover"
                    />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate mb-1">
                        {listing.title}
                    </h4>
                    <p className="font-semibold text-emerald-600 text-base">
                        {listing.price?.toLocaleString()} FCFA
                    </p>
                    {(listing.condition || listing.location) && (
                        <div className="flex items-center gap-2 mt-1">
                            {listing.condition && (
                                <span className="text-xs text-gray-500">
                                    {listing.condition}
                                </span>
                            )}
                            {listing.condition && listing.location && (
                                <span className="text-xs text-gray-300">•</span>
                            )}
                            {listing.location && (
                                <span className="text-xs text-gray-500">
                                    {listing.location}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
