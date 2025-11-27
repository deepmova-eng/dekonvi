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
            const { data, error } = await supabase
                .from('conversations')
                .select(`
          *,
          other_user:profiles!conversations_user1_id_fkey(*),
          last_message:messages(content, created_at, sender_id)
        `)
                .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
                .order('updated_at', { ascending: false })

            if (error) throw error

            setConversations(data || [])

            // Sélectionne la première conversation par défaut
            if (data && data.length > 0 && !activeConversationId) {
                setActiveConversationId(data[0].id)
            }
        } catch (error) {
            console.error('Error fetching conversations:', error)
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
            <ChatWindow
                conversationId={activeConversationId}
                currentUserId={user?.id || ''}
            />
        </div>
    )
}
