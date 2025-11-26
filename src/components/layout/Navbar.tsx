import { Link, useNavigate } from 'react-router-dom';
import { useSupabase } from '../../contexts/SupabaseContext';
import { useState } from 'react';
import {
    Search,
    Heart,
    MessageCircle,
    User,
    PlusCircle,
    Grid,
    LogIn,
    LogOut,
    Settings
} from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
    const { user, signOut } = useSupabase();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">

                {/* LOGO */}
                <Link to="/" className="navbar-logo">
                    <span>DEKONVI</span>
                </Link>

                {/* BARRE DE RECHERCHE (centre) */}
                <div className="navbar-search">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher des annonces..."
                    />
                </div>

                {/* NAVIGATION PRINCIPALE (droite) */}
                <div className="navbar-links">

                    <Link to="/categories" className="navbar-link">
                        <Grid size={20} />
                        <span>Catégories</span>
                    </Link>

                    {user ? (
                        <>
                            {/* Utilisateur connecté */}
                            <Link to="/favorites" className="navbar-link">
                                <Heart size={20} />
                                <span>Favoris</span>
                            </Link>

                            <Link to="/messages" className="navbar-link">
                                <MessageCircle size={20} />
                                <span>Messages</span>
                            </Link>

                            <Link to="/create-listing" className="navbar-link navbar-link--primary">
                                <PlusCircle size={20} />
                                <span>Publier</span>
                            </Link>

                            <div className="navbar-user-menu">
                                <button
                                    className="navbar-user-button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <User size={20} />
                                    <span>Mon compte</span>
                                </button>

                                <div className={`navbar-dropdown ${isDropdownOpen ? 'show' : ''}`}>
                                    <Link to="/profile" className="navbar-dropdown-item">
                                        <User size={16} />
                                        Mon profil
                                    </Link>

                                    <Link to="/admin" className="navbar-dropdown-item">
                                        <Settings size={16} />
                                        Admin
                                    </Link>

                                    <button
                                        onClick={handleLogout}
                                        className="navbar-dropdown-item navbar-dropdown-item--danger"
                                    >
                                        <LogOut size={16} />
                                        Déconnexion
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Utilisateur non connecté */}
                            <Link to="/login" className="navbar-link">
                                <LogIn size={20} />
                                <span>Connexion</span>
                            </Link>
                        </>
                    )}
                </div>

                {/* MENU MOBILE (hamburger) */}
                <button className="navbar-mobile-toggle">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </nav>
    );
}
