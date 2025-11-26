import React from 'react';
import { ChevronLeft, Heart, Share2 } from 'lucide-react';

interface ProductHeaderProps {
  title: string;
  onBack: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
}

export default function ProductHeader({ 
  title, 
  onBack, 
  onToggleFavorite, 
  isFavorite 
}: ProductHeaderProps) {
  return (
    <div className="sticky top-0 bg-white z-50 px-4 py-3 flex items-center justify-between border-b">
      <button onClick={onBack} className="p-2">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <h1 className="font-semibold truncate flex-1 mx-4">{title}</h1>
      <div className="flex items-center space-x-4">
        <button className="p-2">
          <Share2 className="w-6 h-6" />
        </button>
        <button onClick={onToggleFavorite} className="p-2">
          <Heart className={`w-6 h-6 ${isFavorite ? 'fill-primary-500 text-primary-500' : ''}`} />
        </button>
      </div>
    </div>
  );
}