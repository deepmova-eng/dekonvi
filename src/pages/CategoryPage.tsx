import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDebounce } from '../hooks/useDebounce'
import { useListings } from '../hooks/useListings'
import { Smartphone, Shirt, Home as HomeIcon, Car, Book, Package, ArrowLeft, SlidersHorizontal } from 'lucide-react'
import './CategoryPage.css'

const CATEGORIES = {
    electronics: { name: 'Électronique', icon: Smartphone, color: '#3B82F6', dbValue: 'high-tech' },
    fashion: { name: 'Mode', icon: Shirt, color: '#EC4899', dbValue: 'mode' },
    home: { name: 'Maison', icon: HomeIcon, color: '#10B981', dbValue: 'maison' },
    vehicles: { name: 'Véhicules', icon: Car, color: '#F59E0B', dbValue: 'vehicules' },
    books: { name: 'Livres & Loisirs', icon: Book, color: '#8B5CF6', dbValue: 'loisirs' },
    other: { name: 'Autre', icon: Package, color: '#6B7280', dbValue: 'autres' },
}

export default function CategoryPage() {
    const { categoryId } = useParams<{ categoryId: string }>()
    const [filters, setFilters] = useState({
        subcategory: '',
        minPrice: '',
        maxPrice: '',
        condition: '',
        city: '',
    })
    const [sortBy, setSortBy] = useState('recent')

    // Debounce filtres prix et ville pour éviter le flash
    const debouncedMinPrice = useDebounce(filters.minPrice, 500)
    const debouncedMaxPrice = useDebounce(filters.maxPrice, 500)
    const debouncedCity = useDebounce(filters.city, 500)

    const category = CATEGORIES[categoryId as keyof typeof CATEGORIES]
    const Icon = category?.icon || Package

    // ✅ React Query hook - remplace tout le code useEffect + fetchListings
    const { data: listings = [], isLoading: loading } = useListings({
        category: category?.dbValue,
        status: 'active',
        minPrice: debouncedMinPrice ? parseFloat(debouncedMinPrice) : undefined,
        maxPrice: debouncedMaxPrice ? parseFloat(debouncedMaxPrice) : undefined,
        location: debouncedCity || undefined,
    })

    const resetFilters = () => {
        setFilters({
            subcategory: '',
            minPrice: '',
            maxPrice: '',
            condition: '',
            city: '',
        })
    }

    if (!category) {
        return (
            <div className="category-page">
                <div className="container">
                    <div className="error-state">
                        <h2>Catégorie introuvable</h2>
                        <Link to="/" className="btn-primary">Retour à l'accueil</Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="category-page">

            {/* Header */}
            <div className="category-header" style={{ '--category-color': category.color } as any}>
                <div className="container">
                    <Link to="/" className="back-link">
                        <ArrowLeft size={20} />
                        Retour
                    </Link>

                    <div className="header-content">
                        <div className="header-icon">
                            <Icon size={48} />
                        </div>
                        <div className="header-text">
                            <h1 className="category-title">{category.name}</h1>
                            <p className="category-count">
                                {listings.length} {listings.length > 1 ? 'annonces' : 'annonce'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenu */}
            <div className="category-content">
                <div className="container">
                    <div className="content-layout">

                        {/* Sidebar filtres */}
                        <aside className="filters-sidebar">
                            <div className="filters-header">
                                <h3>
                                    <SlidersHorizontal size={20} />
                                    Filtres
                                </h3>
                                <button className="btn-reset" onClick={resetFilters}>
                                    Réinitialiser
                                </button>
                            </div>

                            <div className="filters-list">

                                {/* Prix */}
                                <div className="filter-group">
                                    <label className="filter-label">Prix (FCFA)</label>
                                    <div className="price-inputs">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={filters.minPrice}
                                            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                                            className="filter-input"
                                        />
                                        <span>-</span>
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={filters.maxPrice}
                                            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                            className="filter-input"
                                        />
                                    </div>
                                </div>

                                {/* État */}
                                <div className="filter-group">
                                    <label className="filter-label">État</label>
                                    <select
                                        value={filters.condition}
                                        onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
                                        className="filter-select"
                                    >
                                        <option value="">Tous</option>
                                        <option value="neuf">Neuf</option>
                                        <option value="comme-neuf">Comme neuf</option>
                                        <option value="bon-etat">Bon état</option>
                                        <option value="etat-correct">État correct</option>
                                    </select>
                                </div>

                                {/* Ville */}
                                <div className="filter-group">
                                    <label className="filter-label">Ville</label>
                                    <input
                                        type="text"
                                        placeholder="Lomé, Kara..."
                                        value={filters.city}
                                        onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                                        className="filter-input"
                                    />
                                </div>
                            </div>
                        </aside>

                        {/* Grid d'annonces */}
                        <main className="listings-main">

                            {/* Barre de tri */}
                            <div className="sort-bar">
                                <span className="sort-label">Trier par :</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="sort-select"
                                >
                                    <option value="recent">Plus récent</option>
                                    <option value="price_asc">Prix croissant</option>
                                    <option value="price_desc">Prix décroissant</option>
                                </select>
                            </div>

                            {/* Loading */}
                            {loading && (
                                <div className="loading-state">
                                    <div className="spinner-large" />
                                    <p>Chargement des annonces...</p>
                                </div>
                            )}

                            {/* Empty state */}
                            {!loading && listings.length === 0 && (
                                <div className="empty-state">
                                    <div className="empty-icon">📦</div>
                                    <h3>Aucune annonce trouvée</h3>
                                    <p>Essayez de modifier vos filtres</p>
                                    <button onClick={resetFilters} className="btn-secondary">
                                        Réinitialiser les filtres
                                    </button>
                                </div>
                            )}

                            {/* Grid */}
                            {!loading && listings.length > 0 && (
                                <div className="listings-grid">
                                    {listings.map((listing) => (
                                        <Link
                                            key={listing.id}
                                            to={`/ listing / ${listing.id} `}
                                            className="listing-card"
                                        >
                                            <div className="listing-image">
                                                <img
                                                    src={listing.images?.[0] || '/placeholder.png'}
                                                    alt={listing.title}
                                                />
                                            </div>
                                            <div className="listing-content">
                                                <h3 className="listing-title">{listing.title}</h3>
                                                <p className="listing-price">
                                                    {listing.price.toLocaleString()} FCFA
                                                </p>
                                                <div className="listing-meta">
                                                    <span>{listing.location || 'Non spécifié'}</span>
                                                    <span>•</span>
                                                    <span>{new Date(listing.created_at).toLocaleDateString('fr-FR')}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>
        </div>
    )
}
