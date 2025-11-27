import { useState, useEffect, useCallback } from 'react'
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
    const [showChatOnMobile, setShowChatOnMobile] = useState(false)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

    const fetchConversations = useCallback(async () => {
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
    }, [user?.id, activeConversationId])

    const subscribeToConversations = useCallback(() => {
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
    }, [fetchConversations])

    useEffect(() => {
        if (user) {
            fetchConversations()
            const cleanup = subscribeToConversations()
            return cleanup
        }
    }, [user, fetchConversations, subscribeToConversations])

    // Détecte la taille d'écran pour mobile
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024)
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Gère la sélection de conversation
    const handleSelectConversation = (id: string) => {
        console.log('🎯 handleSelectConversation called:', { id, isMobile, showChatOnMobile })
        setActiveConversationId(id)

        // Sur mobile, affiche le chat et cache la sidebar
        if (isMobile) {
            console.log('📱 Setting showChatOnMobile to TRUE')
            setShowChatOnMobile(true)
        } else {
            console.log('💻 Desktop mode - not changing showChatOnMobile')
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

            {/* Sidebar - Cachée sur mobile si chat ouvert */}
            <div className={`sidebar-wrapper ${showChatOnMobile && isMobile ? 'mobile-hidden' : ''}`}>
                <ConversationSidebar
                    conversations={conversations}
                    activeId={activeConversationId}
                    onSelect={handleSelectConversation}
                    currentUserId={user?.id || ''}
                />
            </div>

            {/* Chat - Caché sur mobile si pas de conversation sélectionnée */}
            {activeConversationId && (
                <div className={`chat-wrapper ${!showChatOnMobile && isMobile ? 'mobile-hidden' : ''}`}>
                    <ChatWindow
                        key={activeConversationId}
                        conversationId={activeConversationId}
                        currentUserId={user?.id || ''}
                        onBack={() => {
                            console.log('📱 onBack called - Before:', { showChatOnMobile, isMobile })
                            setShowChatOnMobile(false)
                            console.log('📱 onBack called - After setShowChatOnMobile(false)')
                            // Ne pas changer activeConversationId pour garder la conversation en mémoire
                        }}
                    />
                </div>
            )}
        </div>
    )
}
