import { useState, useEffect } from 'react'
import { useSupabase } from '../contexts/SupabaseContext'
import { useConversations } from '../hooks/useMessages'
import { ConversationSidebar } from '../components/messaging/ConversationSidebar'
import { ChatWindow } from '../components/messaging/ChatWindow'
import { useSearchParams } from 'react-router-dom'
import './MessagingPremium.css'

export default function MessagingPremium() {
    const { user } = useSupabase()
    const [searchParams] = useSearchParams()
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
    const [isMobileViewingChat, setIsMobileViewingChat] = useState(false)

    // ✅ React Query hook - remplace tout le code fetchConversations + subscriptions
    const { data: conversations = [], isLoading: loading, refetch } = useConversations(user?.id);

    // Auto-select conversation from URL parameter
    useEffect(() => {
        const conversationParam = searchParams.get('conversation')
        if (conversationParam && conversations.length > 0) {
            const conv = conversations.find((c: any) => c.id === conversationParam)
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
        // Refresh the conversation list using React Query refetch
        refetch()

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
