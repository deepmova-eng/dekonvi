import React from 'react';
import ProductCard from './ProductCard';
import type { Listing } from '../../types/listing';

interface PremiumListingsProps {
  listings: Listing[];
  onProductSelect: (id: string) => void;
}

export default function PremiumListings({ listings, onProductSelect }: PremiumListingsProps) {
  if (!listings.length) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-amber-100 py-4 mb-4 rounded-lg">
      <div className="px-2 sm:px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Annonces à la une</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          {listings.map((listing) => (
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