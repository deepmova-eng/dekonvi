import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

export function useConversations(userId: string | undefined) {
  return useQuery({
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

      // 2. Collect IDs
      const userIds = new Set<string>()
      const listingIds = new Set<string>()

      conversations.forEach(conv => {
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
      const enrichedConversations = conversations.map(conv => ({
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
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) throw new Error('Conversation ID requis')

      // 1. Fetch messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (messagesError) throw messagesError

      if (!messages || messages.length === 0) return []

      // 2. Fetch profiles for senders
      const senderIds = [...new Set(messages.map(m => m.sender_id))]

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', senderIds)

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        // Return messages without profiles if profile fetch fails
        return messages
      }

      // 3. Merge data
      const enrichedMessages = messages.map(msg => ({
        ...msg,
        profiles: profiles?.find(p => p.id === msg.sender_id) || null
      }))

      return enrichedMessages
    },
    enabled: !!conversationId,
    staleTime: 1000 * 10, // 10 secondes
    refetchInterval: 5000, // Polling toutes les 5 secondes
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
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['messages', data.conversation_id],
        (old: any[]) => {
          // Replace temp message with real one
          return old ? old.map(msg =>
            msg.id.startsWith('temp-') ? data : msg
          ) : [data]
        }
      )
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
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

      // Récupérer les conversations de l'utilisateur
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

      if (convError || !conversations) return 0

      const conversationIds = conversations.map(c => c.id)

      if (conversationIds.length === 0) return 0

      // Compter combien de conversations ONT au moins 1 message non lu
      let countWithUnread = 0

      for (const convId of conversationIds) {
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
    staleTime: 1000 * 5, // 5 seconds
    refetchInterval: options?.refetchInterval ?? 5000, // 5 seconds by default
  })
}