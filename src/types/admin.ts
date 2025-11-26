export interface PendingListing {
  id: string;
  title: string;
  description: string;
  price: number;
  sellerId: string;
  sellerName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  images: string[];
  category: string;
}

export interface PremiumRequest {
  id: string;
  listingId: string;
  listingTitle: string;
  sellerId: string;
  sellerName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  duration: number; // en jours
  price: number;
}

export interface Report {
  id: string;
  listingId: string;
  listingTitle: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: Date;
  description: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'moderator';
  createdAt: Date;
  lastLogin: Date;
}