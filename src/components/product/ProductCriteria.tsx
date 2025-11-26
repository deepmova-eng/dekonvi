import React from 'react';
import { Tag, Ruler } from 'lucide-react';

interface ProductCriteriaProps {
  category: string;
}

export default function ProductCriteria({ category }: ProductCriteriaProps) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-2">Critères</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2 text-gray-600">
          <Tag className="w-5 h-5" />
          <span>Catégorie: {category}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <Ruler className="w-5 h-5" />
          <span>État: Bon état</span>
        </div>
      </div>
    </div>
  );
}