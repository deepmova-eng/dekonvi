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
        <>
            {/* MOBILE VIEW - Mutually exclusive: either sidebar OR chat */}
            <div className="md:hidden h-screen w-full bg-white">
                {isMobileViewingChat && activeConversationId ? (
                    <ChatWindow
                        conversationId={activeConversationId}
                        currentUserId={user?.id || ''}
                        onMobileBack={() => {
                            console.log("📱 PARENT : Fermeture du chat demandée")
                            setIsMobileViewingChat(false)
                            console.log("📱 PARENT : setIsMobileViewingChat(false) appelé")
                        }}
                        onConversationDeleted={handleConversationDeleted}
                    />
                ) : (
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
                )}
            </div>

            {/* DESKTOP VIEW - Side by side layout */}
            <div className="hidden md:flex h-screen w-full bg-gray-50">
                {/* Sidebar - Fixed width */}
                <div className="w-[380px] flex-shrink-0 border-r bg-white">
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

                {/* Chat - Remaining space */}
                <div className="flex-1 relative overflow-hidden">
                    {activeConversationId ? (
                        <ChatWindow
                            conversationId={activeConversationId}
                            currentUserId={user?.id || ''}
                            onMobileBack={() => setIsMobileViewingChat(false)}
                            onConversationDeleted={handleConversationDeleted}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <div className="text-6xl mb-4">💬</div>
                            <h3 className="text-xl font-semibold text-gray-600">Sélectionnez une conversation</h3>
                            <p className="text-sm mt-2">Choisissez une conversation pour commencer</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
