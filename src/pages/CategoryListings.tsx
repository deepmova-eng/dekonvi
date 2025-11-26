import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import ProductCard from '../components/home/ProductCard';
import { categories } from '../config/categories';
import { useSupabaseListings } from '../hooks/useSupabaseListings';

export default function CategoryListings() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'price-asc' | 'price-desc'>('date');

  const category = categories.find(c => c.id === categoryId);

  // Fetch listings only if subcategory is selected
  const { listings, loading } = useSupabaseListings(
    selectedSubcategory ? categoryId : undefined,
    selectedSubcategory || undefined
  );

  // Trier les résultats
  const sortedListings = [...listings].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  if (!category) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Catégorie non trouvée</p>
      </div>
    );
  }

  // Show subcategories if none selected
  if (!selectedSubcategory) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-[72px] bg-white z-50 border-b">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => navigate('/')} className="p-2">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">{category.name}</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>

        {/* Subcategories List */}
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">Choisissez une sous-catégorie</p>
          <div className="space-y-2">
            {category.subcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubcategory(sub.id)}
                className="w-full flex items-center justify-between p-4 bg-white rounded-lg hover:bg-gray-50 transition-colors border"
              >
                <span className="font-medium">{sub.name}</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show listings for selected subcategory
  const selectedSub = category.subcategories.find(s => s.id === selectedSubcategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-[72px] bg-white z-50">
        <div className="flex items-center justify-between p-4 border-b">
          <button onClick={() => setSelectedSubcategory(null)} className="p-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <p className="text-sm text-gray-500">{category.name}</p>
            <h1 className="text-xl font-bold">{selectedSub?.name}</h1>
          </div>
          <button className="p-2">
            <Filter className="w-6 h-6" />
          </button>
        </div>

        {/* Sort Options */}
        <div className="p-4 border-b">
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSortBy('date')}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${sortBy === 'date'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700'
                }`}
            >
              Plus récents
            </button>
            <button
              onClick={() => setSortBy('price-asc')}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${sortBy === 'price-asc'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700'
                }`}
            >
              Prix croissant
            </button>
            <button
              onClick={() => setSortBy('price-desc')}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${sortBy === 'price-desc'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700'
                }`}
            >
              Prix décroissant
            </button>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : sortedListings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sortedListings.map((listing) => (
              <ProductCard
                key={listing.id}
                listing={listing}
                onClick={() => navigate(`/product/${listing.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">Aucune annonce dans cette sous-catégorie</p>
          </div>
        )}
      </div>
    </div>
  );
}