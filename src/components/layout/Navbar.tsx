import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
    ChevronDown,
    Menu,
    X
} from 'lucide-react'
import { categories } from '../../config/categories'
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
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
    const [scrollProgress, setScrollProgress] = useState(0)
    const [typingPlaceholder, setTypingPlaceholder] = useState('')
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
    const [isTyping, setIsTyping] = useState(true)

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
                            >
                                <MessageCircle size={18} />
                                <span>Messages</span>
                                <span className="notification-badge">3</span>
                            </Link>
                        </>
                    )}
                </div>

                {/* ACTIONS (droite) */}
                <div className="navbar-actions">

                    {/* Barre de recherche */}
                    <div className="search-box">
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
                            {/* Bouton Publier */}
                            <Link to="/create-listing" className="btn-publish">
                                <PlusCircle size={18} />
                                <span>Publier</span>
                            </Link>

                            {/* Menu utilisateur */}
                            <div className="user-menu">
                                <button
                                    className="user-avatar"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setActiveDropdown(activeDropdown === 'user' ? null : 'user')
                                    }}
                                >
                                    <img src={user.user_metadata?.avatar_url || '/default-avatar.png'} alt="" />
                                    <div className="user-status online" />
                                </button>

                                {activeDropdown === 'user' && (
                                    <div className="user-dropdown">
                                        <div className="dropdown-header">
                                            <img src={user.user_metadata?.avatar_url || '/default-avatar.png'} alt="" />
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

                    {/* Menu mobile toggle */}
                    <button
                        className="mobile-menu-toggle"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
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
                            <Link to="/messages" className="mobile-nav-link">
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
