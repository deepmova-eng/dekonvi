
import { ChevronLeft, Shield, Star } from 'lucide-react';

interface SellerProfileProps {
  seller: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    totalRatings: number;
    isRecommended: boolean;
    activeListings: number;
  };
  onProfileClick: () => void;
}

export default function SellerProfile({ seller, onProfileClick }: SellerProfileProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onProfileClick}
        className="w-full p-4 flex items-center space-x-4"
      >
        <div className="relative">
          {seller.avatar ? (
            <img
              src={seller.avatar}
              alt={seller.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {seller.name.charAt(0)}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">{seller.name}</h3>
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </div>
          <div className="text-sm text-gray-500">{seller.activeListings} annonces</div>
          <div className="flex items-center mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${star <= seller.rating
                  ? 'fill-primary-500 text-primary-500'
                  : 'text-gray-300'
                  }`}
              />
            ))}
            <span className="ml-1 text-sm text-gray-500">
              ({seller.totalRatings})
            </span>
          </div>
        </div>
      </button>
      {seller.isRecommended && (
        <div className="bg-primary-500/10 text-primary-500 px-4 py-2 flex items-center">
          <Shield className="w-4 h-4 mr-2" />
          Profil recommandé
        </div>
      )}
    </div>
  );
}