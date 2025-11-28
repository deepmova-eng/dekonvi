import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Send, Paperclip, X } from 'lucide-react'
import { ChatHeaderMenu } from './ChatHeaderMenu'
import { MessageBubble } from './MessageBubble'
import { ConversationHeader } from './ConversationHeader'
import { DateSeparator } from './DateSeparator'
import { uploadMessageImage, validateImage } from '../../lib/imageUpload'
import { getRelativeTime } from '../../lib/timeUtils'
import './ChatWindow.css'

interface Props {
    conversationId: string | null
    currentUserId: string
    onMobileBack?: () => void
    onConversationDeleted?: () => void
}

export function ChatWindow({ conversationId, currentUserId, onMobileBack, onConversationDeleted }: Props) {
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [otherUser, setOtherUser] = useState<any>(null)
    const [listing, setListing] = useState<any>(null)
    const [showMenu, setShowMenu] = useState(false)
    const [selectedImages, setSelectedImages] = useState<File[]>([])
    const [previewUrls, setPreviewUrls] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const subscriptionRef = useRef<any>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Fetch messages
    const fetchMessages = useCallback(async () => {
        if (!conversationId) return

        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })

            if (error) throw error

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
            return
        }

        // Cleanup previous subscription
        if (subscriptionRef.current) {
            try {
                subscriptionRef.current.unsubscribe()
            } catch (e) {
                console.error('Error unsubscribing:', e)
            }
            subscriptionRef.current = null
        }


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

                    // Ajoute le message seulement si ce n'est pas le sien
                    // (le sien est déjà ajouté par optimistic update)
                    if (payload.new.sender_id !== currentUserId) {
                        setMessages((prev) => {
                            // Évite les doublons
                            const exists = prev.find(m => m.id === payload.new.id)
                            if (exists) {
                                return prev
                            }
                            return [...prev, payload.new]
                        })
                    } else {
                    }
                }
            )
            .subscribe((status, err) => {
                if (err) {
                    console.error('❌ Subscription error:', err)
                }

                if (status === 'SUBSCRIBED') {
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ REALTIME CHANNEL ERROR - Check Supabase Dashboard')
                } else if (status === 'TIMED_OUT') {
                    console.error('⏱️ REALTIME SUBSCRIPTION TIMED OUT - Retrying...')
                    // Retry after 2 seconds
                    setTimeout(() => {
                        fetchMessages()
                        fetchOtherUser()
                    }, 2000)
                }
            })

        subscriptionRef.current = channel

        // Fetch initial data
        fetchMessages()
        fetchOtherUser()

        // Cleanup on unmount
        return () => {
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
        if ((!newMessage.trim() && selectedImages.length === 0) || sending || !conversationId) return

        const messageContent = newMessage.trim()
        const tempId = `temp-${Date.now()}`

        try {
            setSending(true)
            setUploading(true)

            // 1. Upload images if any
            let imageUrls: string[] = []
            if (selectedImages.length > 0) {

                const uploadPromises = selectedImages.map((file) =>
                    uploadMessageImage(file, currentUserId)
                )

                const uploadResults = await Promise.all(uploadPromises)
                imageUrls = uploadResults
                    .filter((result) => result !== null)
                    .map((result) => result!.url)

                if (imageUrls.length !== selectedImages.length) {
                    throw new Error('Certaines images n\'ont pas pu être uploadées')
                }

            }

            // 2. OPTIMISTIC UPDATE - Ajoute le message immédiatement
            const optimisticMessage = {
                id: tempId,
                conversation_id: conversationId,
                sender_id: currentUserId,
                content: messageContent,
                images: imageUrls,
                created_at: new Date().toISOString(),
                is_sending: true,
            }

            setMessages((prev) => [...prev, optimisticMessage])
            setNewMessage('')
            setSelectedImages([])
            setPreviewUrls([])
            setUploading(false)

            // 3. Envoie le vrai message à Supabase
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: currentUserId,
                    content: messageContent || '📷 Image', // Message par défaut si vide
                    images: imageUrls,
                })
                .select()
                .single()

            if (error) throw error


            // 4. Remplace le message temporaire par le vrai
            setMessages((prev) =>
                prev.map((msg) => (msg.id === tempId ? data : msg))
            )

            // 5. Update conversation updated_at
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

    // Gestion des images
    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (!files || files.length === 0) return

        const validFiles: File[] = []
        const newPreviewUrls: string[] = []

        Array.from(files).forEach((file) => {
            const error = validateImage(file)
            if (error) {
                alert(error.message)
                return
            }

            validFiles.push(file)
            newPreviewUrls.push(URL.createObjectURL(file))
        })

        setSelectedImages((prev) => [...prev, ...validFiles])
        setPreviewUrls((prev) => [...prev, ...newPreviewUrls])

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const removeImage = (index: number) => {
        // Libérer l'URL de preview
        URL.revokeObjectURL(previewUrls[index])

        setSelectedImages((prev) => prev.filter((_, i) => i !== index))
        setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
    }

    // Nettoyer les URLs de preview au démontage
    useEffect(() => {
        return () => {
            previewUrls.forEach((url) => URL.revokeObjectURL(url))
        }
    }, [previewUrls])

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
        <div className="flex flex-col h-full bg-white overflow-hidden">

            {/* Header */}
            <ConversationHeader
                otherUserName={otherUser?.name || 'Utilisateur'}
                otherUserAvatar={otherUser?.avatar_url}
                lastActivity={otherUser?.last_seen ? getRelativeTime(otherUser.last_seen) : "En ligne"}
                onMenuClick={() => setShowMenu(!showMenu)}
                onMobileBack={onMobileBack}
                showMobileBack={true}
            />

            {/* Menu dropdown */}
            {showMenu && (
                <ChatHeaderMenu
                    listingId={listing?.id || null}
                    otherUserId={otherUser?.id}
                    conversationId={conversationId || ''}
                    onClose={() => setShowMenu(false)}
                    onConversationDeleted={onConversationDeleted}
                />
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-gray-50 to-white px-4 py-3">
                <div className="flex flex-col max-w-4xl mx-auto">
                    {messages.map((message, index) => {
                        const isOwn = message.sender_id === currentUserId

                        // Check if we need a date separator
                        const showDateSeparator = index === 0 ||
                            new Date(messages[index - 1].created_at).toDateString() !== new Date(message.created_at).toDateString()

                        // Check if message is part of a group (same sender as previous)
                        const isGrouped = index > 0 &&
                            messages[index - 1].sender_id === message.sender_id &&
                            !showDateSeparator

                        return (
                            <div
                                key={message.id}
                                className={isGrouped ? 'mt-1' : 'mt-3'}
                            >
                                {showDateSeparator && (
                                    <DateSeparator date={message.created_at} />
                                )}
                                <MessageBubble
                                    content={message.content}
                                    isOwn={isOwn}
                                    timestamp={getTimeDisplay(message.created_at)}
                                    images={message.images || []}
                                    isSending={message.is_sending}
                                    readAt={message.read_at}
                                    deliveredAt={message.delivered_at}
                                />
                            </div>
                        )
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 bg-white px-4 py-3 flex items-center gap-3 shrink-0">
                {/* Input file caché */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                />

                {/* Image previews */}
                {previewUrls.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 bg-gray-50 p-2 flex gap-2 overflow-x-auto">
                        {previewUrls.map((url, index) => (
                            <div key={index} className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                                <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                <button
                                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                                    onClick={() => removeImage(index)}
                                    type="button"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors disabled:opacity-50"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                    disabled={uploading}
                >
                    <Paperclip size={20} />
                </button>

                <div className="flex-1 flex items-center gap-2 bg-gray-100 border border-gray-300 rounded-full px-4 py-2 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                    <input
                        type="text"
                        placeholder="Écrivez votre message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        className="flex-1 bg-transparent border-none outline-none text-[15px] text-gray-900 placeholder-gray-400"
                        disabled={sending || uploading}
                    />
                </div>

                <button
                    className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg disabled:shadow-none"
                    onClick={handleSend}
                    disabled={(!newMessage.trim() && selectedImages.length === 0) || sending || uploading}
                >
                    {uploading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : sending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Send size={20} />
                    )}
                </button>
            </div>
        </div>
    )
}

export default ChatWindow
