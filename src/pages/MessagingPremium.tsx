import { useState, useEffect, useCallback } from 'react'
import { useSupabase } from '../contexts/SupabaseContext'
import { supabase } from '../lib/supabase'
import { ConversationSidebar } from '../components/messaging/ConversationSidebar'
import { ChatWindow } from '../components/messaging/ChatWindow'
import { useSearchParams } from 'react-router-dom'
import './MessagingPremium.css'

export default function MessagingPremium() {
    const { user } = useSupabase()
    const [searchParams] = useSearchParams()
    const [conversations, setConversations] = useState<any[]>([])
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [isMobileViewingChat, setIsMobileViewingChat] = useState(false)

    const fetchConversations = useCallback(async () => {
        try {
            // Récupérer toutes les conversations de l'utilisateur
            const { data: convs, error: convError } = await supabase
                .from('conversations')
                .select('*')
                .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
                .order('created_at', { ascending: false })
                .limit(100)  // ✅ Limit to 100 most recent conversations

            if (convError) throw convError

            // 🔥 CRITIQUE : Récupérer deleted_at timestamps, PAS juste conversation_id
            const { data: deletions } = await (supabase as any)
                .from('conversation_deletions')
                .select('conversation_id, deleted_at')
                .eq('user_id', user?.id || '')

            // Map pour accès rapide : conversation_id → deleted_at
            const deletionMap = new Map(
                deletions?.map((d: any) => [d.conversation_id, d.deleted_at]) || []
            )

            // 🔥 CRITIQUE : Filtrer les conversations
            const filteredConvs = await Promise.all(
                (convs || []).map(async (conv: any) => {
                    const deletedAt = deletionMap.get(conv.id)

                    // Conversation jamais supprimée → Toujours afficher
                    if (!deletedAt) return conv

                    // Conversation supprimée → Vérifier si messages APRÈS suppression
                    const { data: newMessages } = await supabase
                        .from('messages')
                        .select('id')
                        .eq('conversation_id', conv.id)
                        .gt('created_at', deletedAt)
                        .limit(1)

                    // Si nouveaux messages → Afficher
                    // Sinon → Cacher (return null)
                    return newMessages && newMessages.length > 0 ? conv : null
                })
            )

            // Retirer les conversations null (supprimées sans nouveaux messages)
            const activeConvs = filteredConvs.filter((conv: any) => conv !== null)

            // Pour chaque conversation, récupérer l'autre utilisateur et le dernier message
            const conversationsWithDetails = await Promise.all(
                activeConvs.map(async (conv: any) => {
                    // Déterminer l'ID de l'autre utilisateur
                    const otherUserId = conv.user1_id === user?.id ? conv.user2_id : conv.user1_id

                    // Récupérer le profil de l'autre utilisateur
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', otherUserId)
                        .single()

                    // Récupérer le listing associé à la conversation
                    const { data: listing } = await supabase
                        .from('listings')
                        .select('id, title, price, images')
                        .eq('id', conv.listing_id)
                        .single()

                    // Récupérer le dernier message
                    const { data: lastMsg } = await supabase
                        .from('messages')
                        .select('*')
                        .eq('conversation_id', conv.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle()

                    return {
                        ...conv,
                        other_user: profile,
                        listing: listing,
                        last_message: lastMsg ? [lastMsg] : [],
                    }
                })
            )

            setConversations(conversationsWithDetails)

            // Sélectionne la première conversation par défaut
            if (conversationsWithDetails && conversationsWithDetails.length > 0 && !activeConversationId) {
                setActiveConversationId(conversationsWithDetails[0].id)
            }
        } catch (error) {
            console.error('❌ Error fetching conversations:', error)
        } finally {
            setLoading(false)
        }
    }, [user?.id, activeConversationId])


    const subscribeToConversations = useCallback(() => {
        // Subscribe to conversations table changes
        const conversationsSubscription = supabase
            .channel('conversations_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                },
                () => {
                    fetchConversations()
                }
            )
            .subscribe()

        // Subscribe to messages table changes to update last_message in sidebar
        const messagesSubscription = supabase
            .channel('messages_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                () => {
                    fetchConversations() // Refresh to update last_message
                }
            )
            .subscribe()

        // Subscribe to conversation_deletions to detect auto-restore by trigger
        const deletionsSubscription = supabase
            .channel('deletions_changes')
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'conversation_deletions',
                },
                () => {
                    fetchConversations() // Refresh when conversation restored
                }
            )
            .subscribe()

        return () => {
            conversationsSubscription.unsubscribe()
            messagesSubscription.unsubscribe()
            deletionsSubscription.unsubscribe()
        }
    }, [fetchConversations])

    useEffect(() => {
        if (user) {
            fetchConversations()
            const cleanup = subscribeToConversations()
            return cleanup
        }
    }, [user, fetchConversations, subscribeToConversations])

    // Auto-select conversation from URL parameter
    useEffect(() => {
        const conversationParam = searchParams.get('conversation')
        if (conversationParam && conversations.length > 0) {
            const conv = conversations.find(c => c.id === conversationParam)
            if (conv) {
                setActiveConversationId(conversationParam)
                setIsMobileViewingChat(true)
            }
        }
    }, [searchParams, conversations])

    if (loading) {
        return (
            <div className="messaging-premium">
                <div className="loading-messaging">
                    <div className="spinner-large" />
                    <p>Chargement des conversations...</p>
                </div>
            </div>
        )
    }

    const handleConversationDeleted = () => {
        // Refresh the conversation list
        fetchConversations()

        // Deselect the active conversation
        setActiveConversationId(null)

        // On mobile, go back to sidebar
        setIsMobileViewingChat(false)
    }

    return (
        <div className={`messaging-premium ${isMobileViewingChat ? 'mobile-viewing-chat' : ''}`}>

            {/* Sidebar - Cachée sur mobile si chat ouvert */}
            <div className="sidebar-wrapper">
                <ConversationSidebar
                    conversations={conversations}
                    activeId={activeConversationId}
                    onSelect={(id) => {
                        setActiveConversationId(id)
                        setIsMobileViewingChat(true)
                    }}
                    currentUserId={user?.id || ''}
                    activeListing={conversations.find(c => c.id === activeConversationId)?.listing}
                    onDeleteConversation={handleConversationDeleted}
                />
            </div>

            {/* Chat */}
            {activeConversationId && (
                <div className="chat-wrapper">
                    <ChatWindow
                        key={activeConversationId}
                        conversationId={activeConversationId}
                        currentUserId={user?.id || ''}
                        onMobileBack={() => setIsMobileViewingChat(false)}
                        onConversationDeleted={handleConversationDeleted}
                    />
                </div>
            )}
        </div>
    )
}
