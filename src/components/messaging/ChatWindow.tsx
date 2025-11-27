import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Send, Smile, Paperclip, MoreVertical, ArrowLeft } from 'lucide-react'
import { ChatHeaderMenu } from './ChatHeaderMenu'
import './ChatWindow.css'

interface Props {
    conversationId: string | null
    currentUserId: string
    onMobileBack?: () => void
}

export function ChatWindow({ conversationId, currentUserId, onMobileBack }: Props) {
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [otherUser, setOtherUser] = useState<any>(null)
    const [listing, setListing] = useState<any>(null)
    const [showMenu, setShowMenu] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const subscriptionRef = useRef<any>(null)

    // Fetch messages
    const fetchMessages = useCallback(async () => {
        if (!conversationId) return

        try {
            console.log('📥 Fetching messages for:', conversationId)
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })

            if (error) throw error

            console.log('✅ Messages loaded:', data?.length)
            setMessages(data || [])
        } catch (error) {
            console.error('❌ Error fetching messages:', error)
        }
    }, [conversationId])

    // Fetch other user and listing
    const fetchOtherUser = useCallback(async () => {
        if (!conversationId || !currentUserId) return

        try {
            // Récupère la conversation avec l'annonce liée
            const { data: conv, error: convError } = await supabase
                .from('conversations')
                .select(`
                    *,
                    listing:listings(
                        id,
                        title,
                        price,
                        images
                    )
                `)
                .eq('id', conversationId)
                .single()

            if (convError) throw convError

            console.log('📦 Conversation with listing:', conv)

            const otherUserId = conv.user1_id === currentUserId ? conv.user2_id : conv.user1_id

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', otherUserId)
                .single()

            if (profileError) throw profileError

            setOtherUser(profile)

            // Sauvegarde l'annonce dans le state
            if (conv.listing) {
                setListing(conv.listing)
            }
        } catch (error) {
            console.error('❌ Error fetching user:', error)
        }
    }, [conversationId, currentUserId])

    // Setup realtime subscription
    // Setup realtime subscription
    useEffect(() => {
        if (!conversationId) {
            console.log('❌ No conversationId, skipping subscription')
            return
        }

        // Cleanup previous subscription
        if (subscriptionRef.current) {
            console.log('🧹 Cleaning up old subscription')
            try {
                subscriptionRef.current.unsubscribe()
            } catch (e) {
                console.error('Error unsubscribing:', e)
            }
            subscriptionRef.current = null
        }

        console.log('========================================')
        console.log('🔌 SETTING UP REALTIME SUBSCRIPTION')
        console.log('Conversation ID:', conversationId)
        console.log('Current User ID:', currentUserId)
        console.log('========================================')

        // Create new subscription
        const channel = supabase
            .channel(`messages:${conversationId}`, {
                config: {
                    broadcast: { self: false }, // N'écoute pas ses propres broadcasts
                },
            })
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    console.log('========================================')
                    console.log('🆕 REALTIME MESSAGE RECEIVED!')
                    console.log('From sender:', payload.new.sender_id)
                    console.log('Current user:', currentUserId)
                    console.log('Message:', payload.new.content)
                    console.log('Full payload:', payload.new)
                    console.log('========================================')

                    // Ajoute le message seulement si ce n'est pas le sien
                    // (le sien est déjà ajouté par optimistic update)
                    if (payload.new.sender_id !== currentUserId) {
                        console.log('✅ Adding message from OTHER user to state')
                        setMessages((prev) => {
                            // Évite les doublons
                            const exists = prev.find(m => m.id === payload.new.id)
                            if (exists) {
                                console.log('⚠️ Message already exists, skipping')
                                return prev
                            }
                            console.log('✅ Message added to state')
                            return [...prev, payload.new]
                        })
                    } else {
                        console.log('ℹ️ Message from SELF, skipping (already in optimistic update)')
                    }
                }
            )
            .subscribe((status, err) => {
                console.log('========================================')
                console.log('📡 SUBSCRIPTION STATUS CHANGED')
                console.log('Status:', status)
                if (err) {
                    console.error('❌ Subscription error:', err)
                }
                console.log('========================================')

                if (status === 'SUBSCRIBED') {
                    console.log('✅ SUCCESSFULLY SUBSCRIBED TO REALTIME')
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ REALTIME CHANNEL ERROR - Check Supabase Dashboard')
                } else if (status === 'TIMED_OUT') {
                    console.error('⏱️ REALTIME SUBSCRIPTION TIMED OUT - Retrying...')
                    // Retry after 2 seconds
                    setTimeout(() => {
                        console.log('🔄 Retrying subscription...')
                        fetchMessages()
                        fetchOtherUser()
                    }, 2000)
                }
            })

        subscriptionRef.current = channel

        // Fetch initial data
        console.log('📥 Fetching initial messages...')
        fetchMessages()
        fetchOtherUser()

        // Cleanup on unmount
        return () => {
            console.log('🔌 Component unmounting, unsubscribing from:', conversationId)
            if (subscriptionRef.current) {
                try {
                    subscriptionRef.current.unsubscribe()
                } catch (e) {
                    console.error('Error during cleanup:', e)
                }
                subscriptionRef.current = null
            }
        }
    }, [conversationId, currentUserId, fetchMessages, fetchOtherUser])

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleSend = async () => {
        if (!newMessage.trim() || sending || !conversationId) return

        const messageContent = newMessage.trim()
        const tempId = `temp-${Date.now()}`

        try {
            setSending(true)

            // 1. OPTIMISTIC UPDATE - Ajoute le message immédiatement
            const optimisticMessage = {
                id: tempId,
                conversation_id: conversationId,
                sender_id: currentUserId,
                content: messageContent,
                created_at: new Date().toISOString(),
                is_sending: true, // Flag pour styling différent
            }

            console.log('⚡ Optimistic update:', optimisticMessage)
            setMessages((prev) => [...prev, optimisticMessage])
            setNewMessage('') // Clear input immédiatement

            // 2. Envoie le vrai message à Supabase
            console.log('📤 Sending to Supabase...')
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: currentUserId,
                    content: messageContent,
                })
                .select()
                .single()

            if (error) throw error

            console.log('✅ Message sent:', data)

            // 3. Remplace le message temporaire par le vrai
            setMessages((prev) =>
                prev.map((msg) => (msg.id === tempId ? data : msg))
            )

            // 4. Update conversation updated_at
            await supabase
                .from('conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', conversationId)

        } catch (error) {
            console.error('❌ Error sending message:', error)

            // Supprime le message temporaire en cas d'erreur
            setMessages((prev) => prev.filter((msg) => msg.id !== tempId))

            alert('Erreur lors de l\'envoi du message')

            // Restore le texte dans l'input
            setNewMessage(messageContent)
        } finally {
            setSending(false)
        }
    }

    const getTimeDisplay = (date: string) => {
        return new Date(date).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    if (!conversationId) {
        return (
            <div className="chat-window empty">
                <div className="empty-chat-state">
                    <div className="empty-icon">💬</div>
                    <h3>Sélectionnez une conversation</h3>
                    <p>Choisissez une conversation dans la liste pour commencer à discuter</p>
                </div>
            </div>
        )
    }

    return (
        <div className="chat-window">

            {/* Header */}
            <div className="chat-header">

                {/* Bouton retour mobile */}
                <button
                    className="mobile-back-button"
                    onClick={onMobileBack}
                >
                    <ArrowLeft size={20} />
                    <span>Retour</span>
                </button>

                {/* Reste du header existant */}
                <div className="header-user">
                    <img
                        src={otherUser?.avatar_url || '/default-avatar.png'}
                        alt={otherUser?.name}
                        className="header-avatar"
                    />
                    <div className="header-info">
                        <h3 className="header-name">{otherUser?.name || 'Utilisateur'}</h3>
                        <span className="header-status">En ligne</span>
                    </div>
                </div>

                <div className="header-actions">
                    {/* Annonce liée */}
                    {listing ? (
                        <div
                            className="chat-listing-info"
                            onClick={() => window.location.href = `/listings/${listing.id}`}
                        >
                            <img
                                src={listing.images?.[0] || '/placeholder.png'}
                                alt={listing.title}
                                className="listing-thumbnail"
                            />
                            <div className="listing-details">
                                <h4 className="listing-title">{listing.title}</h4>
                                <p className="listing-price">{listing.price?.toLocaleString()} FCFA</p>
                            </div>
                        </div>
                    ) : (
                        <div className="no-listing">Annonce supprimée</div>
                    )}


                    {/* Menu 3 points */}
                    <button
                        className="action-btn"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <MoreVertical size={20} />
                    </button>

                    {/* Menu dropdown */}
                    {showMenu && (
                        <ChatHeaderMenu
                            listingId={listing?.id || null}
                            otherUserId={otherUser?.id}
                            conversationId={conversationId || ''}
                            onClose={() => setShowMenu(false)}
                        />
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="messages-container">
                <div className="messages-list">
                    {messages.map((message, index) => {
                        const isOwn = message.sender_id === currentUserId
                        const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id
                        const isSending = message.is_sending

                        return (
                            <div
                                key={message.id}
                                className={`message-wrapper ${isOwn ? 'own' : 'other'} ${isSending ? 'sending' : ''}`}
                            >
                                {!isOwn && showAvatar && (
                                    <img
                                        src={otherUser?.avatar_url || '/default-avatar.png'}
                                        alt=""
                                        className="message-avatar"
                                    />
                                )}
                                {!isOwn && !showAvatar && <div className="message-avatar-spacer" />}

                                <div className="message-bubble">
                                    <p className="message-text">{message.content}</p>
                                    <div className="message-meta">
                                        <span className="message-time">{getTimeDisplay(message.created_at)}</span>
                                        {isOwn && !isSending && <span className="message-status">✓✓</span>}
                                        {isSending && <span className="message-status">⏱</span>}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="message-input-container">
                <button className="input-action-btn">
                    <Paperclip size={20} />
                </button>

                <div className="input-wrapper">
                    <input
                        type="text"
                        placeholder="Écrivez votre message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        className="message-input"
                        disabled={sending}
                    />
                    <button className="input-action-btn">
                        <Smile size={20} />
                    </button>
                </div>

                <button
                    className="send-btn"
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                >
                    {sending ? (
                        <div className="spinner-small" />
                    ) : (
                        <Send size={20} />
                    )}
                </button>
            </div>
        </div>
    )
}

export default ChatWindow
