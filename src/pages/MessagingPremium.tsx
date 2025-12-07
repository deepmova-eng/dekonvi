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

    // ✅ Don't block the UI with a spinner - show skeleton instead
    // The ConversationSidebar will handle the loading state with skeletons

    const handleConversationDeleted = () => {
        // Refresh the conversation list using React Query refetch
        refetch()

        // Deselect the active conversation
        setActiveConversationId(null)

        // On mobile, go back to sidebar
        setIsMobileViewingChat(false)
    }

    // Lock body scroll on desktop to prevent global scrollbar
    useEffect(() => {
        const isDesktop = window.matchMedia('(min-width: 768px)').matches
        if (isDesktop) {
            document.body.style.overflow = 'hidden'
            document.documentElement.style.overflow = 'hidden'
        }
        return () => {
            document.body.style.overflow = ''
            document.documentElement.style.overflow = ''
        }
    }, [])

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
                        onDeleteConversation={handleConversationDeleted}
                        loading={loading}
                    />
                )}
            </div>

            {/* DESKTOP VIEW - Side by side layout */}
            <div className="hidden md:flex h-screen w-full bg-gray-50 overflow-hidden">
                {/* Sidebar - Fixed width */}
                <div className="w-[380px] flex-shrink-0 border-r bg-white h-full overflow-hidden pt-16">
                    <ConversationSidebar
                        conversations={conversations}
                        activeId={activeConversationId}
                        onSelect={(id) => {
                            setActiveConversationId(id)
                            setIsMobileViewingChat(true)
                        }}
                        currentUserId={user?.id || ''}
                        onDeleteConversation={handleConversationDeleted}
                        loading={loading}
                    />
                </div>

                {/* Chat - Remaining space */}
                <div className="flex-1 relative h-full overflow-hidden pt-16">
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
