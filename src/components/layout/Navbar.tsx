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
import './Navbar.css'

export default function Navbar() {
    const { user, signOut } = useSupabase()
    const location = useLocation()
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

    // Detect scroll
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

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
                                    <div className="mega-menu-section">
                                        <h4>Électronique</h4>
                                        <Link to="/categories/smartphones">Smartphones</Link>
                                        <Link to="/categories/ordinateurs">Ordinateurs</Link>
                                        <Link to="/categories/tv">TV & Audio</Link>
                                    </div>
                                    <div className="mega-menu-section">
                                        <h4>Mode</h4>
                                        <Link to="/categories/vetements">Vêtements</Link>
                                        <Link to="/categories/chaussures">Chaussures</Link>
                                        <Link to="/categories/accessoires">Accessoires</Link>
                                    </div>
                                    <div className="mega-menu-section">
                                        <h4>Maison</h4>
                                        <Link to="/categories/meubles">Meubles</Link>
                                        <Link to="/categories/decoration">Décoration</Link>
                                        <Link to="/categories/electromenager">Électroménager</Link>
                                    </div>
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
                            placeholder="Rechercher..."
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
