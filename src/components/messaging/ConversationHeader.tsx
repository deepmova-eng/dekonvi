import { MoreVertical, ArrowLeft } from 'lucide-react'

interface ConversationHeaderProps {
    otherUserName: string
    otherUserAvatar?: string
    lastActivity?: string
    onMenuClick: () => void
    onMobileBack?: () => void
    showMobileBack?: boolean
    loading?: boolean
    listingImage?: string
    listingTitle?: string
    listingPrice?: number
    listingId?: string
}

export function ConversationHeader({
    otherUserName,
    otherUserAvatar,
    lastActivity,
    onMenuClick,
    onMobileBack,
    showMobileBack = false,
    loading = false,
    listingImage,
    listingTitle,
    listingPrice,
    listingId
}: ConversationHeaderProps) {

    return (
        <div className="sticky top-0 z-[1000] bg-white relative" style={{
            height: '72px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}>
            <div className="h-full px-3 md:px-6 flex items-center justify-between gap-3 md:gap-4">
                {loading ? (
                    /* Loading skeleton */
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                        <div className="flex flex-col gap-2 flex-1">
                            <div className="h-5 w-40 bg-gray-200 animate-pulse rounded" />
                            <div className="h-4 w-56 bg-gray-100 animate-pulse rounded" />
                        </div>
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-200 animate-pulse" />
                    </div>
                ) : (
                    <>
                        {/* ZONE A: Back Button (Left) - Enhanced touch target on mobile */}
                        {showMobileBack && onMobileBack && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onMobileBack()
                                }}
                                className="flex-shrink-0 flex items-center justify-center w-10 h-10 md:w-10 md:h-10 rounded-full hover:bg-gray-100 transition-colors -ml-1 md:ml-0"
                                aria-label="Retour"
                                style={{ padding: '8px' }}
                            >
                                <ArrowLeft size={22} className="text-gray-800" strokeWidth={2} />
                            </button>
                        )}

                        {/* ZONE B: Main Content (Center-Left) */}
                        <div className="flex-1 min-w-0">
                            {/* Line 1: Product Title (Bold, Primary) - Truncated */}
                            <h1 className="font-bold text-gray-900 truncate text-[15px] md:text-[18px]" style={{ lineHeight: '20px', maxWidth: '100%' }}>
                                {listingTitle || 'Annonce'}
                            </h1>

                            {/* Line 2: Meta Info - Simplified on mobile */}
                            <p className="text-gray-600 truncate text-[13px] md:text-[14px]" style={{ lineHeight: '18px' }}>
                                {/* Price (always shown) */}
                                {listingPrice !== undefined && (
                                    <span className="font-semibold text-emerald-600">
                                        {listingPrice.toLocaleString()} FCFA
                                    </span>
                                )}

                                {/* Separator + User Name */}
                                {listingPrice !== undefined && otherUserName && (
                                    <span className="text-gray-500"> • </span>
                                )}
                                {otherUserName && (
                                    <>
                                        {/* Mobile: Only name / Desktop: "Vendu par" + name */}
                                        <span className="hidden md:inline text-gray-600">Vendu par </span>
                                        <span className="font-medium text-gray-800">{otherUserName}</span>
                                    </>
                                )}

                                {/* Activity status (desktop only) */}
                                {lastActivity && (
                                    <>
                                        <span className="text-gray-400 hidden md:inline"> • </span>
                                        <span className="text-gray-500 hidden md:inline">{lastActivity}</span>
                                    </>
                                )}
                            </p>
                        </div>

                        {/* ZONE C: Visual Block (Right) - Smaller on mobile */}
                        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                            {/* Product Image with Overlapping Seller Avatar */}
                            <div
                                className="relative cursor-pointer group"
                                onClick={() => listingId && window.open(`/listings/${listingId}`, '_blank')}
                            >
                                {/* Product Image - 42px mobile, 48px desktop */}
                                {listingImage ? (
                                    <img
                                        src={listingImage}
                                        alt={listingTitle || 'Produit'}
                                        className="w-[42px] h-[42px] md:w-12 md:h-12 rounded-lg object-cover bg-gray-100 border border-gray-200 group-hover:opacity-90 transition-opacity"
                                    />
                                ) : (
                                    <div className="w-[42px] h-[42px] md:w-12 md:h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                                        <span className="text-xs font-medium">IMG</span>
                                    </div>
                                )}

                                {/* Seller Avatar - Overlapping bottom-right corner - 18px mobile, 20px desktop */}
                                <div
                                    className="absolute -bottom-1 -right-1"
                                    style={{
                                        width: '18px',
                                        height: '18px',
                                        border: '2px solid white',
                                        borderRadius: '50%',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {otherUserAvatar ? (
                                        <img
                                            src={otherUserAvatar}
                                            alt={otherUserName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-emerald-500 flex items-center justify-center text-white font-bold" style={{ fontSize: '9px' }}>
                                            {otherUserName?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Menu Button */}
                            <button
                                onClick={onMenuClick}
                                className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
                                aria-label="Menu"
                            >
                                <MoreVertical size={20} className="text-gray-700" />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
