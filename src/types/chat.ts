export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  otherParticipantName?: string;
  otherParticipantAvatar?: string | null;
  lastMessage?: {
    content: string;
    createdAt: Date;
    senderId: string;
  };
  listingId?: string;
  listingTitle?: string;
  listingImage?: string;
  sellerName?: string;
  unreadCount: number;
  createdAt?: Date;
  status?: 'active' | 'deleted';
}