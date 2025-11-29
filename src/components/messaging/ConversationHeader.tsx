import React from 'react'
import { MoreVertical, ArrowLeft } from 'lucide-react'

interface ConversationHeaderProps {
    otherUserName: string
    otherUserAvatar?: string
    lastActivity?: string
    onMenuClick: () => void
    onMobileBack?: () => void
    showMobileBack?: boolean
}

export function ConversationHeader({
    otherUserName,
    otherUserAvatar,
    lastActivity,
    onMenuClick,
    onMobileBack,
    showMobileBack = false
}: ConversationHeaderProps) {

    return (
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200" style={{ paddingTop: '18px', paddingBottom: '18px' }}>

            <div className="px-4 md:px-6 flex items-center justify-between gap-3">
                {/* Left section: Back button (mobile) + Avatar + User info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">

                    {/* Mobile back button */}
                    {showMobileBack && onMobileBack && (
                        <button
                            onClick={onMobileBack}
                            className="md:hidden flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Retour"
                        >
                            <ArrowLeft size={20} className="text-gray-700" />
                        </button>
                    )}

                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        {otherUserAvatar ? (
                            <img
                                src={otherUserAvatar}
                                alt={otherUserName}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold text-base">
                                {otherUserName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* User info */}
                    <div className="flex flex-col min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                            {otherUserName}
                        </h3>
                        {lastActivity && (
                            <span className="text-xs md:text-sm text-gray-500 truncate">
                                {lastActivity}
                            </span>
                        )}
                    </div>
                </div>

                {/* Right section: Menu button */}
                <button
                    onClick={onMenuClick}
                    className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Menu"
                >
                    <MoreVertical size={20} className="text-gray-700" />
                </button>
            </div>
        </div>
    )
}
