import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../../contexts/SupabaseContext'
import {
    Home,
    Search,
    Heart,
    MessageCircle,
    User,
    PlusCircle,
    Grid,
    LogOut,
    Settings,
    ChevronDown
} from 'lucide-react'
import { categories } from '../../config/categories'
import NotificationBell from '../notifications/NotificationBell'
import UserAvatar from '../common/UserAvatar'
import { useUnreadMessagesCount } from '../../hooks/useMessages'
import { supabase } from '../../lib/supabase'
import './Navbar.css'

const TYPING_PHRASES = [
    'Rechercher...',
    'Trouver un iPhone...',
    'Chercher une voiture...',
    'Découvrir un appartement...',
    'Acheter un vélo...',
    'Trouver des vêtements...'
]

export default function Navbar() {
    const { user, signOut } = useSupabase()
    const location = useLocation()
    const queryClient = useQueryClient()
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
    const [scrollProgress, setScrollProgress] = useState(0)
    const [typingPlaceholder, setTypingPlaceholder] = useState('')
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
    const [isTyping, setIsTyping] = useState(true)

    // Unread messages count
    const { data: unreadMessagesCount = 0 } = useUnreadMessagesCount(user?.id)

    // Detect scroll + progress bar
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)

            // Calculate scroll progress
            const windowHeight = window.innerHeight
            const documentHeight = document.documentElement.scrollHeight
            const scrollTop = window.scrollY
            const scrollableHeight = documentHeight - windowHeight
            const progress = scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0
            setScrollProgress(Math.min(progress, 100))
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Typing placeholder animation
    useEffect(() => {
        const currentPhrase = TYPING_PHRASES[currentPhraseIndex]
        let currentIndex = 0
        let timeoutId: NodeJS.Timeout

        if (isTyping) {
            // Typing effect
            const typeNextChar = () => {
                if (currentIndex <= currentPhrase.length) {
                    setTypingPlaceholder(currentPhrase.substring(0, currentIndex))
                    currentIndex++
                    timeoutId = setTimeout(typeNextChar, 100)
                } else {
                    // Pause before deleting
                    timeoutId = setTimeout(() => setIsTyping(false), 2000)
                }
            }
            typeNextChar()
        } else {
            // Deleting effect
            const deleteNextChar = () => {
                if (currentIndex >= 0) {
                    setTypingPlaceholder(currentPhrase.substring(0, currentIndex))
                    currentIndex--
                    timeoutId = setTimeout(deleteNextChar, 50)
                } else {
                    // Move to next phrase
                    setCurrentPhraseIndex((prev) => (prev + 1) % TYPING_PHRASES.length)
                    setIsTyping(true)
                }
            }
            currentIndex = currentPhrase.length
            deleteNextChar()
        }

        return () => clearTimeout(timeoutId)
    }, [currentPhraseIndex, isTyping])

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null)
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    const isActive = (path: string) => location.pathname === path

    const handleLogout = async () => {
        await signOut()
    }

    // Prefetch conversations on Messages hover for instant loading
    const handleMessagesPrefetch = () => {
        if (!user?.id) return

        queryClient.prefetchQuery({
            queryKey: ['conversations', user.id],
            queryFn: async () => {
                // Fetch conversations
                const { data: conversations, error: convError } = await supabase
                    .from('conversations')
                    .select('*')
                    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
                    .order('updated_at', { ascending: false })

                if (convError || !conversations || conversations.length === 0) {
                    return []
                }

                // Filter deletions
                const { data: deletions } = await supabase
                    .from('conversation_deletions')
                    .select('conversation_id, deleted_at')
                    .eq('user_id', user.id)

                const deletionMap = new Map(
                    (deletions as any[])?.map((d: any) => [d.conversation_id, d.deleted_at]) || []
                )

                const visibleConversations = await Promise.all(
                    (conversations as any[]).map(async (conv: any) => {
                        const deletedAt = deletionMap.get(conv.id)
                        if (!deletedAt) return conv

                        const { data: newMessages } = await supabase
                            .from('messages')
                            .select('id')
                            .eq('conversation_id', conv.id)
                            .gt('created_at', deletedAt)
                            .limit(1)

                        return newMessages && newMessages.length > 0 ? conv : null
                    })
                )

                const activeConversations = visibleConversations.filter(conv => conv !== null) as any[]

                if (activeConversations.length === 0) return []

                // Collect IDs
                const userIds = new Set<string>()
                const listingIds = new Set<string>()

                activeConversations.forEach((conv: any) => {
                    userIds.add(conv.user1_id)
                    userIds.add(conv.user2_id)
                    if (conv.listing_id) listingIds.add(conv.listing_id)
                })

                // Fetch profiles and listings
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, name, avatar_url, email')
                    .in('id', Array.from(userIds))

                const { data: listings } = await supabase
                    .from('listings')
                    .select('id, title, images, price')
                    .in('id', Array.from(listingIds))

                // Enrich conversations
                return activeConversations.map((conv: any) => ({
                    ...conv,
                    user1: (profiles as any[])?.find((p: any) => p.id === conv.user1_id),
                    user2: (profiles as any[])?.find((p: any) => p.id === conv.user2_id),
                    listing: (listings as any[])?.find((l: any) => l.id === conv.listing_id)
                }))
            }
        })
    }

    return (
        <nav className={`navbar-premium ${isScrolled ? 'scrolled' : ''}`}>
            {/* Scroll Progress Bar */}
            <div className="scroll-progress-bar">
                <div
                    className="scroll-progress-fill"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>
            <div className="navbar-container">

                {/* LOGO */}
                <Link to="/" className="navbar-logo">
                    <div className="logo-icon">
                        <span className="logo-text">DEKONVI</span>
                    </div>
                </Link>

                {/* NAVIGATION PRINCIPALE (desktop) */}
                <div className="navbar-nav">
                    <Link
                        to="/"
                        className={`nav-link ${isActive('/') ? 'active' : ''}`}
                    >
                        <Home size={18} />
                        <span>Accueil</span>
                    </Link>

                    <div className="nav-link-dropdown">
                        <button
                            className={`nav-link ${isActive('/categories') ? 'active' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation()
                                setActiveDropdown(activeDropdown === 'categories' ? null : 'categories')
                            }}
                        >
                            <Grid size={18} />
                            <span>Catégories</span>
                            <ChevronDown size={16} className={activeDropdown === 'categories' ? 'rotated' : ''} />
                        </button>

                        {/* Mega Menu Catégories */}
                        {activeDropdown === 'categories' && (
                            <div className="mega-menu">
                                <div className="mega-menu-content">
                                    {categories.slice(0, 3).map((category) => (
                                        <div key={category.id} className="mega-menu-section">
                                            <h4>{category.name}</h4>
                                            {category.subcategories.map((sub) => (
                                                <Link
                                                    key={sub.id}
                                                    to={`/?category=${category.id}&subcategory=${sub.id}`}
                                                    onClick={() => setActiveDropdown(null)}
                                                >
                                                    {sub.name}
                                                </Link>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {user && (
                        <>
                            <Link
                                to="/favorites"
                                className={`nav-link ${isActive('/favorites') ? 'active' : ''}`}
                            >
                                <Heart size={18} />
                                <span>Favoris</span>
                            </Link>

                            <Link
                                to="/messages"
                                className={`nav-link ${isActive('/messages') ? 'active' : ''}`}
                                style={{ position: 'relative' }}
                                onMouseEnter={handleMessagesPrefetch}
                            >
                                <MessageCircle size={18} />
                                <span>Messages</span>
                                {unreadMessagesCount > 0 && (
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: '-4px',
                                            right: '-4px',
                                            backgroundColor: '#ef4444',
                                            color: 'white',
                                            borderRadius: '10px',
                                            padding: '2px 6px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            minWidth: '18px',
                                            height: '18px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '2px solid white',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                                    </span>
                                )}
                            </Link>
                        </>
                    )}
                </div>

                {/* ACTIONS (droite) */}
                <div className="navbar-actions">

                    {/* Barre de recherche - Hidden on mobile, use Hero search instead */}
                    <div className="search-box hidden md:flex">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder={typingPlaceholder}
                            className="search-input"
                        />
                        <kbd className="search-shortcut">⌘K</kbd>
                    </div>

                    {user ? (
                        <>
                            {/* Notifications */}
                            <NotificationBell />

                            {/* Bouton Publier */}
                            <Link to="/create-premium" className="btn-publish hidden md:flex">
                                <PlusCircle size={18} />
                                <span>Publier</span>
                            </Link>

                            {/* Menu utilisateur */}
                            <div className="user-menu hidden md:block">
                                <button
                                    className="user-avatar-btn"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setActiveDropdown(activeDropdown === 'user' ? null : 'user')
                                    }}
                                >
                                    <UserAvatar user={user} size="w-10 h-10" showStatus />
                                </button>

                                {activeDropdown === 'user' && (
                                    <div className="user-dropdown">
                                        <div className="dropdown-header">
                                            <UserAvatar user={user} size="w-12 h-12" />
                                            <div>
                                                <p className="user-name">{user.user_metadata?.name || 'Utilisateur'}</p>
                                                <p className="user-email">{user.email}</p>
                                            </div>
                                        </div>

                                        <div className="dropdown-divider" />

                                        <Link to="/profile" className="dropdown-item">
                                            <User size={16} />
                                            Mon profil
                                        </Link>

                                        <Link to="/admin" className="dropdown-item">
                                            <Settings size={16} />
                                            Administration
                                        </Link>

                                        <div className="dropdown-divider" />

                                        <button onClick={handleLogout} className="dropdown-item danger">
                                            <LogOut size={16} />
                                            Déconnexion
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <Link to="/login" className="btn-login">
                            Connexion
                        </Link>
                    )}

                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="mobile-menu">
                    <Link to="/" className="mobile-nav-link">
                        <Home size={20} />
                        Accueil
                    </Link>
                    <Link to="/categories" className="mobile-nav-link">
                        <Grid size={20} />
                        Catégories
                    </Link>
                    {user && (
                        <>
                            <Link to="/favorites" className="mobile-nav-link">
                                <Heart size={20} />
                                Favoris
                            </Link>
                            <Link to="/messages" className="mobile-nav-link" onMouseEnter={handleMessagesPrefetch}>
                                <MessageCircle size={20} />
                                Messages
                            </Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    )
}
