import { useState, TouchEvent, useEffect, useRef } from 'react'
import { MoreVertical, Trash2 } from 'lucide-react'
import './ConversationSidebar.css'

interface ConversationItemProps {
    conv: any
    isActive: boolean
    currentUserId: string
    onSelect: (id: string) => void
    onDelete: (id: string, e: any) => void
    getTimeAgo: (date: string) => string
}

export function ConversationItem({ conv, isActive, currentUserId, onSelect, onDelete, getTimeAgo }: ConversationItemProps) {
    const [showMenu, setShowMenu] = useState(false)
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)
    const [isSwiped, setIsSwiped] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false)
            }
        }

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showMenu])

    // Minimum distance for swipe
    const minSwipeDistance = 50

    const onTouchStart = (e: TouchEvent) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
    }

    const onTouchMove = (e: TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX)
    }

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return

        const distance = touchStart - touchEnd
        const isLeftSwipe = distance > minSwipeDistance
        const isRightSwipe = distance < -minSwipeDistance

        if (isLeftSwipe) {
            setIsSwiped(true)
            // Close menu if open
            setShowMenu(false)
        }
        if (isRightSwipe) {
            setIsSwiped(false)
        }
    }

    const listing = conv.listing

    // CRITICAL: Use last_message_at as primary source, fallback to created_at
    // This ensures we show the actual last message time, not conversation creation time
    const timestamp = conv.last_message_at || conv.created_at
    const displayMessage = conv.last_message || "Démarrer la discussion"
    const unreadCount = conv.unread_count || 0

    return (
        <div className="conversation-item-container">
            {/* Background Delete Button (revealed on swipe) */}
            <div className="swipe-actions">
                <button
                    className="swipe-delete-btn"
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete(conv.id, e)
                        setIsSwiped(false)
                    }}
                >
                    <Trash2 size={20} />
                </button>
            </div>

            {/* Foreground Content */}
            <div
                className={`conversation-item-wrapper ${isSwiped ? 'swiped' : ''}`}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <button
                    className={`conversation-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                        if (isSwiped) {
                            setIsSwiped(false)
                        } else {
                            onSelect(conv.id)
                        }
                    }}
                >
                    {/* Listing Image - Plus rond et moderne */}
                    <div className="flex-shrink-0">
                        <img
                            src={listing?.images?.[0] || '/placeholder-product.png'}
                            alt={listing?.title || 'Annonce'}
                            className="w-12 h-12 rounded-xl object-cover border border-gray-100"
                        />
                    </div>

                    {/* Content - Meilleure hiérarchie visuelle */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                            <h3 className="font-bold text-gray-900 truncate">
                                {listing?.title || 'Annonce'}
                            </h3>
                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                {getTimeAgo(timestamp)}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-500 truncate flex-1">
                                {displayMessage}
                            </p>
                            {unreadCount > 0 && (
                                <div className="unread-badge">{unreadCount}</div>
                            )}
                        </div>
                    </div>
                </button>

                {/* Delete menu button (Desktop/No-swipe) */}
                <button
                    className={`conv-menu-btn ${showMenu ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(!showMenu)
                        setIsSwiped(false)
                    }}
                >
                    <MoreVertical size={18} />
                </button>

                {/* Delete menu dropdown */}
                {showMenu && (
                    <div className="conv-menu-dropdown" ref={menuRef}>
                        <button
                            className="conv-menu-item danger"
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete(conv.id, e)
                                setShowMenu(false)
                            }}
                        >
                            <Trash2 size={16} />
                            <span>Supprimer</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
