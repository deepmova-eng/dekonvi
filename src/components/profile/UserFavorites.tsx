import React from 'react';
import { useFavoriteListings } from '../../hooks/useFavorites';
import ProductCard from '../home/ProductCard';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

interface UserFavoritesProps {
  onProductSelect?: (id: string) => void;
}

export default function UserFavorites({ onProductSelect }: UserFavoritesProps) {
  const { user } = useSupabaseAuth();
  const { data: favoriteListings = [], isLoading: loading } = useFavoriteListings(user?.id);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!favoriteListings.length) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Vous n'avez pas encore de favoris</p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('setActiveTab', { detail: 'search' }))}
          className="mt-4 bg-primary-500 text-white px-6 py-2 rounded-full hover:bg-primary-600 transition-colors"
        >
          Découvrir des produits
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {favoriteListings.map((listing) => (
        <ProductCard
          key={listing.id}
          listing={listing}
        />
      ))}
    </div>
  );
}