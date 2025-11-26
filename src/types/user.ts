export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'banned';
  createdAt: Date;
  lastLogin?: Date;
  avatar?: string;
  phone?: string;
  location?: string;
}

export interface UserProfile extends User {
  totalListings: number;
  rating: number;
  totalRatings: number;
  isRecommended: boolean;
  responseTime?: number;
  responseRate?: number;
}