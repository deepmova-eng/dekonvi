import React from 'react';
import ProductCard from '../components/home/ProductCard';
import { useFavoriteListings } from '../hooks/useFavorites';
import { ChevronLeft, Heart } from 'lucide-react';
import TickerDisplayOnly from '../components/home/TickerDisplayOnly';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../contexts/SupabaseContext';
import { ProductCardSkeleton } from '../components/common/ProductCardSkeleton';
import './Favorites.css';

interface FavoritesProps {
  onProductSelect: (id: string) => void;
}

export default function Favorites({ onProductSelect }: FavoritesProps) {
  const { user } = useSupabase();
  const { data: favoriteListings = [], isLoading: loading, isFetching } = useFavoriteListings(user?.id);
  const navigate = useNavigate();

  // Loader pendant le chargement initial
  if (loading) {
    return (
      <div className="pb-20 lg:pb-0">
        <div className="sticky top-0 bg-white shadow-sm z-10 px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('setActiveTab', { detail: 'search' }));
              navigate('/');
            }}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold">Favoris</h1>
          <div className="md:hidden">
            <TickerDisplayOnly />
          </div>
        </div>
        <div className="px-4 py-4">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state SEULEMENT si pas de loading ET pas de données
  if (!favoriteListings || favoriteListings.length === 0) {
    return (
      <div className="pb-20 lg:pb-0">
        <div className="sticky top-0 bg-white shadow-sm z-10 px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('setActiveTab', { detail: 'search' }));
              navigate('/');
            }}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold">Favoris</h1>
          <div className="md:hidden">
            <TickerDisplayOnly />
          </div>
        </div>
        <div className="px-4 py-4">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Heart size={64} className="text-gray-200 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Aucun favori</h2>
            <p className="text-gray-500 mb-6">Vous n'avez pas encore ajouté d'annonces à vos favoris</p>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('setActiveTab', { detail: 'search' }));
                navigate('/');
              }}
              className="bg-primary-500 text-white px-6 py-2 rounded-full hover:bg-primary-600 transition-colors"
            >
              Découvrir des produits
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0">
      <div className="sticky top-0 bg-white shadow-sm z-10 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('setActiveTab', { detail: 'search' }));
            navigate('/');
          }}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold">Favoris</h1>
        <div className="md:hidden">
          <TickerDisplayOnly />
        </div>
      </div>

      <div className="px-4 py-4 relative">
        {/* Indicateur de refetch en arrière-plan */}
        {isFetching && !loading && (
          <div className="refetch-indicator">
            Mise à jour...
          </div>
        )}

        <div className="favorites-grid">
          {favoriteListings.map((listing: any) => (
            <ProductCard
              key={listing.id}
              listing={listing}
            />
          ))}
        </div>
      </div>
    </div>
  );
}