import React, { useState, useEffect } from 'react';
import { Search, Camera, Grid3x3, List } from 'lucide-react';
import { useSupabase } from '../contexts/SupabaseContext';
import CategoryFilter from '../components/home/CategoryFilter';
import { CategoriesSection } from '../components/home/CategoriesSection';
import ProductCard from '../components/home/ProductCard';
import ProductListItem from '../components/home/ProductListItem';
import HeroSlider from '../components/home/HeroSlider';
import PremiumListings from '../components/home/PremiumListings';
import AdvancedFilters, { type FilterValues } from '../components/home/AdvancedFilters';
import Login from './Login';
import Register from './Register';
import { useInfiniteListings } from '../hooks/useListings';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useDebounce } from '../hooks/useDebounce';
import { categories } from '../config/categories';
import ProductCardSkeleton from '../components/ui/skeletons/ProductCardSkeleton';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';

interface HomeProps {
    onProductSelect: (id: string) => void;
    searchQuery?: string;
}

export default function Home({ onProductSelect, searchQuery = '' }: HomeProps) {
    const { user, loading: authLoading } = useSupabase();
    const queryClient = useQueryClient();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>();
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [searchTerm, setSearchTerm] = useState(searchQuery);
    const [filterValues, setFilterValues] = useState<FilterValues>({});
    const navigate = useNavigate();
    const location = useLocation();

    // Read category and subcategory from URL query parameters
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const categoryParam = params.get('category');
        const subcategoryParam = params.get('subcategory');

        if (categoryParam) {
            setSelectedCategory(categoryParam);
        }
        if (subcategoryParam) {
            setSelectedSubcategory(subcategoryParam);
        }

        // Remove params from URL after reading them
        if (categoryParam || subcategoryParam) {
            params.delete('category');
            params.delete('subcategory');
            const newSearch = params.toString();
            navigate(newSearch ? `/?${newSearch}` : '/', { replace: true });
        }
    }, [location.search, navigate]);

    // View mode state (grid or list) with localStorage persistence
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        const saved = localStorage.getItem('productViewMode');
        return (saved as 'grid' | 'list') || 'grid';
    });

    // Save view mode preference
    useEffect(() => {
        localStorage.setItem('productViewMode', viewMode);
    }, [viewMode]);

    const debouncedSearch = useDebounce(searchTerm, 300);
    const debouncedMinPrice = useDebounce(filterValues.minPrice, 500);
    const debouncedMaxPrice = useDebounce(filterValues.maxPrice, 500);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: loading
    } = useInfiniteListings({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        subcategory: selectedSubcategory,
        search: debouncedSearch,
        status: 'active',
        minPrice: debouncedMinPrice,
        maxPrice: debouncedMaxPrice,
        location: filterValues.location,
    });

    // Flatten pages into single array
    const listings = data?.pages.flatMap(page => page.data) ?? [];

    // Filter premium listings
    const premiumListings = listings.filter(l => l.is_premium);
    const regularListings = listings.filter(l => !l.is_premium);

    // Infinite scroll sentinel
    const sentinelRef = useInfiniteScroll({
        onLoadMore: () => fetchNextPage(),
        hasMore: hasNextPage ?? false,
        isLoading: isFetchingNextPage,
    });

    const handleFilterChange = (newFilters: FilterValues) => {
        setFilterValues(newFilters);
    };

    const handleFilterReset = () => {
        setFilterValues({});
    };

    const handleLoginClick = () => {
        setShowLogin(true);
    };

    const handleRegisterClick = () => {
        setShowRegister(true);
        setShowLogin(false);
    };

    const handleBack = () => {
        setShowLogin(false);
        setShowRegister(false);
    };

    if (showLogin) {
        return <Login onBack={handleBack} onRegisterClick={handleRegisterClick} />;
    }

    if (showRegister) {
        return <Register onBack={handleBack} onLoginClick={() => {
            setShowRegister(false);
            setShowLogin(true);
        }} />;
    }

    return (
        <div className="pb-20 lg:pb-0">
            {/* Header - Hidden on mobile, App.tsx provides mobile header */}
            <div className="bg-white border-b sticky top-[72px] z-50">
                <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4">
                    <div className="flex items-center gap-4">
                        {/* DEKONVI Title */}
                        <h1 className="text-2xl font-bold text-gray-900">DEKONVI</h1>

                        {/* Search Bar */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Rechercher une annonce..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        {/* Advanced Filters Button */}
                        <AdvancedFilters
                            filters={filterValues}
                            onChange={handleFilterChange}
                            onReset={handleFilterReset}
                        />
                    </div>
                </div>
            </div>

            {/* Mobile Search Bar - Visible only on mobile */}
            < div className="lg:hidden bg-white border-b px-4 py-3" >
                <div className="flex items-center bg-gray-100 rounded-lg p-3">
                    <Search className="text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 ml-2 bg-transparent outline-none text-gray-700 placeholder-gray-500"
                    />
                    <Camera className="text-gray-400 w-5 h-5" />
                </div>
            </div >

            {/* Advertising Slider - Hide during search */}
            {!searchTerm && <HeroSlider />}

            {/* Category Cards Premium - Show after slider, hide during search */}
            {!searchTerm && <CategoriesSection />}

            {/* Premium Listings - Hide during search */}
            {
                !searchTerm && premiumListings.length > 0 && (
                    <div className="max-w-7xl mx-auto px-2 sm:px-4 mt-4">
                        <PremiumListings
                            listings={premiumListings}
                            onProductSelect={onProductSelect}
                        />
                    </div>
                )
            }

            {/* Main Content */}
            <div className="bg-white py-4">
                <div className="max-w-7xl mx-auto px-2 sm:px-4">
                    {/* Listings */}
                    <div>
                        {/* Header with toggle */}
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">
                                {searchTerm
                                    ? `Résultats de recherche pour "${searchTerm}"`
                                    : selectedCategory === 'all'
                                        ? 'Annonces récentes'
                                        : `Annonces - ${categories.find(c => c.id === selectedCategory)?.name} `}
                            </h2>

                            {/* View Toggle */}
                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p - 2 rounded transition - all ${viewMode === 'grid'
                                        ? 'bg-white shadow-sm text-primary'
                                        : 'text-gray-500 hover:text-gray-700'
                                        } `}
                                    aria-label="Vue grille"
                                >
                                    <Grid3x3 size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p - 2 rounded transition - all ${viewMode === 'list'
                                        ? 'bg-white shadow-sm text-primary'
                                        : 'text-gray-500 hover:text-gray-700'
                                        } `}
                                    aria-label="Vue liste"
                                >
                                    <List size={20} />
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {[...Array(10)].map((_, i) => (
                                        <ProductCardSkeleton key={i} />
                                    ))}
                                </div>
                            </div>
                        ) : regularListings.length > 0 ? (
                            <>
                                {viewMode === 'grid' ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                        {regularListings.map((listing) => (
                                            <ProductCard
                                                key={listing.id}
                                                listing={listing}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {regularListings.map((listing) => (
                                            <ProductListItem
                                                key={listing.id}
                                                listing={listing}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Infinite Scroll Sentinel */}
                                {hasNextPage && (
                                    <div ref={sentinelRef} className="py-4">
                                        {isFetchingNextPage && (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                                {[...Array(5)].map((_, i) => (
                                                    <ProductCardSkeleton key={`loading-${i}`} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* End of list indicator */}
                                {!hasNextPage && regularListings.length > 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>Vous avez vu toutes les annonces disponibles</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-gray-500">
                                    {searchTerm
                                        ? 'Aucun résultat trouvé pour votre recherche'
                                        : 'Aucune annonce trouvée'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}