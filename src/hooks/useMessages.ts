import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import * as Sentry from '@sentry/react'
import { useEffect } from 'react'

export function useConversations(userId: string | undefined) {

  const query = useQuery({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      console.log('🔍 [useConversations] Fetching for user:', userId)

      if (!userId) {
        console.log('🔍 [useConversations] No userId, returning empty')
        return []
      }

      // 1. Fetch conversations (sans join pour éviter les erreurs)
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('updated_at', { ascending: false })

      console.log('🔍 [useConversations] Query result:', {
        count: conversations?.length,
        error: convError,
        conversations: conversations
      })

      if (convError) {
        console.error('Error fetching conversations:', convError)
        throw convError
      }

      if (!conversations || conversations.length === 0) {
        console.log('🔍 [useConversations] No conversations found')
        return []
      }

      // 1.5. Filter out deleted conversations (only if NO messages after deleted_at)
      const { data: deletions, error: deletionsError } = await supabase
        .from('conversation_deletions')
        .select('conversation_id, deleted_at')
        .eq('user_id', userId)

      if (deletionsError) {
        console.error('Error fetching deletions:', deletionsError)
      }

      // Map for quick access: conversation_id → deleted_at
      const deletionMap = new Map(
        deletions?.map(d => [d.conversation_id, d.deleted_at]) || []
      )

      // Filter conversations: only hide if deleted AND no new messages after deletion
      const visibleConversations = await Promise.all(
        conversations.map(async (conv) => {
          const deletedAt = deletionMap.get(conv.id)

          // Conversation never deleted → Always show
          if (!deletedAt) return conv

          // Conversation deleted → Check if messages AFTER deletion
          const { data: newMessages } = await supabase
            .from('messages')
            .select('id')
            .eq('conversation_id', conv.id)
            .gt('created_at', deletedAt)
            .limit(1)

          // If new messages → Show, otherwise → Hide (return null)
          return newMessages && newMessages.length > 0 ? conv : null
        })
      )

      // Remove null conversations (deleted without new messages)
      const activeConversations = visibleConversations.filter(conv => conv !== null) as any[]

      console.log('🔍 [useConversations] After filtering deletions:', {
        total: conversations.length,
        deleted: deletionMap.size,
        visible: activeConversations.length
      })

      if (activeConversations.length === 0) {
        return []
      }

      // 2. Collect IDs
      const userIds = new Set<string>()
      const listingIds = new Set<string>()

      activeConversations.forEach(conv => {
        userIds.add(conv.user1_id)
        userIds.add(conv.user2_id)
        if (conv.listing_id) listingIds.add(conv.listing_id)
      })

      console.log('🔍 [useConversations] Fetching details:', {
        userIds: Array.from(userIds),
        listingIds: Array.from(listingIds)
      })

      // 3. Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, email')
        .in('id', Array.from(userIds))

      // 4. Fetch listings
      const { data: listings } = await supabase
        .from('listings')
        .select('id, title, images, price')
        .in('id', Array.from(listingIds))

      console.log('🔍 [useConversations] Details fetched:', {
        profilesCount: profiles?.length,
        listingsCount: listings?.length
      })

      // 5. Enrich conversations
      const enrichedConversations = activeConversations.map(conv => ({
        ...conv,
        user1: profiles?.find(p => p.id === conv.user1_id),
        user2: profiles?.find(p => p.id === conv.user2_id),
        listing: listings?.find(l => l.id === conv.listing_id)
      }))

      console.log('🔍 [useConversations] Returning:', enrichedConversations)

      return enrichedConversations
    },
    enabled: !!userId,
    staleTime: 0, // Always fetch fresh
    gcTime: 0, // Don't cache
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  // ❌ REALTIME DÉSACTIVÉ - Revenir au polling pour éviter les erreurs
  // Le polling avec refetchInterval: 5000ms est déjà très performant

  /*
  // Setup Realtime subscription for conversation updates
  useEffect(() => {
    if (!userId) return

    console.log('🔌 [useConversations] Setting up Realtime listener for user:', userId)

    const channel = supabase
      .channel('conversations_list')
      .on(
        'postgres_changes' as any,  // Bypass strict typing
        {
          event: '*', // Listen to all events: INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'conversations',
          // NO FILTER - Manual filtering in JavaScript to avoid binding mismatch
        } as any,
        (payload: any) => {
          try {
            console.log('🔥 [useConversations] Realtime event:', payload.eventType, payload)

            // Manual filtering: check if this update involves the current user
            const record = payload.new || payload.old

            if (record && (record.user1_id === userId || record.user2_id === userId)) {
              console.log('🔄 [useConversations] Conversation update for current user, refetching...')
              query.refetch()
            } else {
              console.log('🔄 [useConversations] Conversation not for current user, ignoring')
            }
          } catch (error) {
            console.error('🔥 [useConversations] Error processing Realtime event:', error)
          }
        }
      )
      .subscribe((status: any) => {
        console.log('🔌 [useConversations] Subscription status:', status)
      })

    return () => {
      console.log('🔌 [useConversations] Cleaning up Realtime listener')
      supabase.removeChannel(channel)
    }
  }, [userId, query.refetch])
  */

  // ✅ POLLING ACTIF avec refetchInterval dans useQuery

  return query
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) {
        throw new Error('Conversation ID requis');
      }

      // 1. Fetch messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('❌ [useMessages] Error:', messagesError);
        throw messagesError;
      }

      if (!messages || messages.length === 0) {
        return [];
      }

      // 2. Fetch profiles for senders
      const senderIds = [...new Set(messages.map(m => m.sender_id))];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', senderIds);

      if (profilesError) {
        console.error('⚠️ [useMessages] Profile error:', profilesError);
        // Return messages without profiles if profile fetch fails
        return messages;
      }

      // 3. Merge data
      const enrichedMessages = messages.map(msg => ({
        ...msg,
        profiles: profiles?.find(p => p.id === msg.sender_id) || null
      }));

      return enrichedMessages;
    },
    enabled: !!conversationId,
    staleTime: 0, // Toujours fetch fresh
    gcTime: 0, // Pas de cache
    refetchInterval: 2000, // Polling toutes les 2 secondes (plus rapide)
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}

import * as Sentry from "@sentry/react"

// ... imports

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      conversationId,
      content
    }: {
      conversationId: string
      content: string
    }) => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Non authentifié')

        const { data, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content,
          })
          .select()
          .single()

        if (error) throw error
        return data
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            feature: 'messaging',
            action: 'send_message',
          },
          extra: {
            conversationId,
            contentLength: content.length,
          },
        })
        throw error
      }
    },
    onMutate: async ({ conversationId, content }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] })

      const previousMessages = queryClient.getQueryData(['messages', conversationId])

      const { data: { user } } = await supabase.auth.getUser()

      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: user?.id,
        content,
        created_at: new Date().toISOString(),
        read: false,
      }

      queryClient.setQueryData(['messages', conversationId], (old: any[]) =>
        [...(old || []), optimisticMessage]
      )

      return { previousMessages }
    },
    onError: (error, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ['messages', variables.conversationId],
          context.previousMessages
        )
      }
      toast.error('Erreur lors de l\'envoi')
    },
    onSuccess: (data, variables) => {
      // Force immediate invalidation and refetch for instant display
      queryClient.invalidateQueries({
        queryKey: ['messages', variables.conversationId]
      });
      queryClient.invalidateQueries({
        queryKey: ['conversations']
      });

      // Auto-scroll to bottom after message is sent
      setTimeout(() => {
        const messagesBody = document.querySelector('.messages-body');
        if (messagesBody) {
          messagesBody.scrollTop = messagesBody.scrollHeight;
        }
      }, 100);
    },
  })
}

export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Marquer tous les messages NON envoyés par moi comme lus
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('read', false)

      if (error) {
        console.error('Error marking messages as read:', error)
        throw error
      }
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] })
    }
  })
}

export function useUnreadMessagesCount(
  userId: string | undefined,
  options?: { refetchInterval?: number | false }
) {
  return useQuery({
    queryKey: ['unread-messages-count', userId],
    queryFn: async () => {
      if (!userId) return 0

      // console.log('🔍 [UnreadCount] Fetching for user:', userId)

      // 🔥 FIX: Get soft-deleted conversations WITH deletion dates
      const { data: deletedConvs } = await (supabase as any)
        .from('conversation_deletions')
        .select('conversation_id, deleted_at')
        .eq('user_id', userId)

      // Create map of conversation_id -> deleted_at
      const deletionDates = new Map(
        deletedConvs?.map((d: any) => [d.conversation_id, d.deleted_at]) || []
      )

      // Récupérer les conversations de l'utilisateur WITH last_message_at
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id, last_message_at')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

      if (convError || !conversations) return 0

      // 🔥 FIX: Filter out soft-deleted conversations
      // BUT allow "resurrected" conversations (last_message_at > deleted_at)
      const activeConversationIds = conversations
        .filter(conv => {
          const deletedAt = deletionDates.get(conv.id);

          // If not deleted, keep it
          if (!deletedAt) return true;

          // If no last message, exclude (old deleted conversation)
          if (!conv.last_message_at) return false;

          // 🔥 RESURRECTION CHECK: If last message is AFTER deletion, keep it
          const lastMsgDate = new Date(conv.last_message_at);
          const deleteDate = new Date(deletedAt);

          return lastMsgDate > deleteDate; // Keep if resurrected
        })
        .map(c => c.id)

      if (activeConversationIds.length === 0) return 0

      // Compter combien de conversations ONT au moins 1 message non lu
      let countWithUnread = 0

      for (const convId of activeConversationIds) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', convId)
          .neq('sender_id', userId)
          .eq('read', false)
          .limit(1) // Juste vérifier s'il y en a au moins 1

        if (count && count > 0) {
          countWithUnread++
        }
      }

      // console.log('🔍 [UnreadCount] Result:', countWithUnread)
      return countWithUnread
    },
    enabled: !!userId,
    staleTime: 0, // Always consider data stale so refetchInterval works properly
    refetchInterval: options?.refetchInterval ?? 3000, // 3 seconds for better responsiveness
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when internet reconnects
  })
}