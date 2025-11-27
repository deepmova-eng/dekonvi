import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Send, Smile, Paperclip, MoreVertical, Phone, Video } from 'lucide-react'
import './ChatWindow.css'

interface Props {
    conversationId: string | null
    currentUserId: string
}

export function ChatWindow({ conversationId, currentUserId }: Props) {
    console.log('🪟 ChatWindow mounted with conversationId:', conversationId, 'currentUserId:', currentUserId)

    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [otherUser, setOtherUser] = useState<any>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Stabiliser subscribeToMessages avec useCallback
    const subscribeToMessages = useCallback(() => {
        if (!conversationId) return () => { }

        console.log('🔌 Setting up realtime subscription for conversation:', conversationId)

        const subscription = supabase
            .channel(`messages_${conversationId} `)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id = eq.${conversationId} `,
                },
                (payload) => {
                    console.log('📨 New message received via realtime:', payload.new)
                    setMessages((prev) => {
                        // Éviter les doublons
                        if (prev.find((m: any) => m.id === payload.new.id)) {
                            console.log('⚠️ Duplicate message detected, skipping')
                            return prev
                        }
                        console.log('✅ Adding new message to state')
                        return [...prev, payload.new]
                    })
                }
            )
            .subscribe((status) => {
                console.log('📡 Subscription status:', status)
            })

        console.log('✅ Subscription created:', subscription)

        return () => {
            console.log('🔌 Unsubscribing from messages channel')
            subscription.unsubscribe()
        }
    }, [conversationId])

    useEffect(() => {
        console.log('🔄 useEffect triggered, conversationId:', conversationId)
        if (conversationId) {
            fetchMessages()
            fetchOtherUser()

            // Initialiser la subscription realtime
            const cleanup = subscribeToMessages()

            // Cleanup lors du démontage ou changement de conversation
            return cleanup
        }
    }, [conversationId, subscribeToMessages])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })

            if (error) throw error
            setMessages(data || [])
        } catch (error) {
            console.error('Error fetching messages:', error)
        }
    }

    const fetchOtherUser = async () => {
        try {
            console.log('👤 Fetching other user for conversation:', conversationId)
            const { data: conv, error } = await supabase
                .from('conversations')
                .select('user1_id, user2_id')
                .eq('id', conversationId)
                .single()

            console.log('📦 Conversation data:', conv, 'Error:', error)

            if (error) throw error

            if (conv) {
                // Déterminer l'autre utilisateur
                const otherUserId = conv.user1_id === currentUserId ? conv.user2_id : conv.user1_id
                console.log('🎯 Other user ID:', otherUserId, 'Current user:', currentUserId)

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', otherUserId)
                    .single()

                console.log('✅ Profile loaded:', profile)
                setOtherUser(profile)
            }
        } catch (error) {
            console.error('❌ Error fetching user:', error)
        }
    }

    const handleSend = async () => {
        if (!newMessage.trim() || sending) return

        try {
            setSending(true)
            console.log('📤 Sending message:', newMessage.trim())

            const { data, error } = await supabase.from('messages').insert({
                conversation_id: conversationId,
                sender_id: currentUserId,
                content: newMessage.trim(),
            }).select()

            console.log('📬 Message sent:', data, 'Error:', error)

            if (error) throw error

            setNewMessage('')
        } catch (error) {
            console.error('❌ Error sending message:', error)
            alert('Erreur lors de l\'envoi')
        } finally {
            setSending(false)
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
                    <button className="action-btn">
                        <Phone size={20} />
                    </button>
                    <button className="action-btn">
                        <Video size={20} />
                    </button>
                    <button className="action-btn">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="messages-container">
                <div className="messages-list">
                    {messages.map((message, index) => {
                        const isOwn = message.sender_id === currentUserId
                        const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id

                        return (
                            <div
                                key={message.id}
                                className={`message - wrapper ${isOwn ? 'own' : 'other'} `}
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
                                        {isOwn && <span className="message-status">✓✓</span>}
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
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
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

// Mémoiser le composant pour éviter les re-renders inutiles
export default React.memo(ChatWindow)
