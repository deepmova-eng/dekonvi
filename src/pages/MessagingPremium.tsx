import { useState, useEffect } from 'react'
import { useSupabase } from '../contexts/SupabaseContext'
import { supabase } from '../lib/supabase'
import { ConversationSidebar } from '../components/messaging/ConversationSidebar'
import { ChatWindow } from '../components/messaging/ChatWindow'
import './MessagingPremium.css'

export default function MessagingPremium() {
    const { user } = useSupabase()
    const [conversations, setConversations] = useState<any[]>([])
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            fetchConversations()
            subscribeToConversations()
        }
    }, [user])

    const fetchConversations = async () => {
        try {
            console.log('🔍 Fetching conversations for user:', user?.id)
            // Récupérer toutes les conversations de l'utilisateur
            const { data: convs, error } = await supabase
                .from('conversations')
                .select('*')
                .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
                .order('created_at', { ascending: false })

            console.log('📦 Raw conversations:', convs, 'Error:', error)

            if (error) throw error

            // Pour chaque conversation, récupérer l'autre utilisateur et le dernier message
            const conversationsWithDetails = await Promise.all(
                (convs || []).map(async (conv: any) => {
                    // Déterminer l'ID de l'autre utilisateur
                    const otherUserId = conv.user1_id === user?.id ? conv.user2_id : conv.user1_id
                    console.log('👤 Other user ID:', otherUserId, 'for conv:', conv.id)

                    // Récupérer le profil de l'autre utilisateur
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', otherUserId)
                        .single()

                    console.log('👨 Profile fetched:', profile)

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
                        last_message: lastMsg ? [lastMsg] : [],
                    }
                })
            )

            console.log('✅ Conversations with details:', conversationsWithDetails)
            setConversations(conversationsWithDetails)

            // Sélectionne la première conversation par défaut
            if (conversationsWithDetails && conversationsWithDetails.length > 0 && !activeConversationId) {
                setActiveConversationId(conversationsWithDetails[0].id)
                console.log('📌 Active conversation set to:', conversationsWithDetails[0].id)
            }
        } catch (error) {
            console.error('❌ Error fetching conversations:', error)
        } finally {
            setLoading(false)
        }
    }

    const subscribeToConversations = () => {
        const subscription = supabase
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

        return () => {
            subscription.unsubscribe()
        }
    }

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

    return (
        <div className="messaging-premium">

            {/* Sidebar conversations */}
            <ConversationSidebar
                conversations={conversations}
                activeId={activeConversationId}
                onSelect={setActiveConversationId}
                currentUserId={user?.id || ''}
            />

            {/* Zone de chat */}
            {activeConversationId && (
                <ChatWindow
                    key={activeConversationId}
                    conversationId={activeConversationId}
                    currentUserId={user?.id || ''}
                />
            )}
        </div>
    )
}
