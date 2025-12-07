import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * Hook to calculate seller's response rate based on messaging activity
 * Returns percentage of conversations where seller has replied
 */
export function useSellerResponseRate(sellerId: string | undefined) {
    return useQuery({
        queryKey: ['seller-response-rate', sellerId],
        queryFn: async () => {
            if (!sellerId) return null;

            // 1. Get all conversations where user is seller (either user1 or user2)
            const { data: conversations, error: convError } = await supabase
                .from('conversations')
                .select('id')
                .or(`user1_id.eq.${sellerId},user2_id.eq.${sellerId}`);

            if (convError) {
                console.error('Error fetching conversations:', convError);
                return null;
            }

            if (!conversations || conversations.length === 0) {
                return null; // No conversations = N/A
            }

            // 2. Count conversations where seller has sent at least one message
            let responseCount = 0;

            for (const conv of conversations) {
                const { data: messages, error: msgError } = await supabase
                    .from('messages')
                    .select('sender_id')
                    .eq('conversation_id', conv.id)
                    .eq('sender_id', sellerId)
                    .limit(1);

                if (msgError) {
                    console.error('Error fetching messages:', msgError);
                    continue;
                }

                if (messages && messages.length > 0) {
                    responseCount++;
                }
            }

            // 3. Calculate percentage
            const responseRate = Math.round((responseCount / conversations.length) * 100);
            return responseRate;
        },
        enabled: !!sellerId,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
        retry: 1, // Retry once on failure
    });
}
