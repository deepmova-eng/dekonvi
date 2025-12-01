export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  read: boolean;
}

export interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  listing_id?: string
  created_at: string
  updated_at: string
  // New fields added in migration 20241201
  last_message?: string | null
  last_message_at?: string | null
  // Legacy fields for compatibility
  participants?: string[]
  otherParticipantName?: string
  otherParticipantAvatar?: string | null
  lastMessage?: {
    content: string
    createdAt: Date
    senderId: string
  }
  listingId?: string
  listingTitle?: string
  listingImage?: string
  sellerName?: string
  unreadCount?: number
  createdAt?: Date
  status?: 'active' | 'deleted'
  // Joined data
  listing?: any
  otherUser?: any
}