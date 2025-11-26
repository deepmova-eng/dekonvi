export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  category: string;
  sellerId: string;
  sellerName?: string;
  status: 'active' | 'pending' | 'rejected';
  createdAt: Date;
  deliveryAvailable?: boolean;
  isPremium?: boolean;
  isUrgent?: boolean; // Nouveau champ pour badge "Urgent"
}