import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Send, Paperclip, X } from 'lucide-react'
import { ChatHeaderMenu } from './ChatHeaderMenu'
import { MessageBubble } from './MessageBubble'
import { ConversationHeader } from './ConversationHeader'
import { DateSeparator } from './DateSeparator'
import { uploadMessageImage, validateImage } from '../../lib/imageUpload'
import { getRelativeTime } from '../../lib/timeUtils'
import { useMarkMessagesAsRead } from '../../hooks/useMessages'
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
    const [conversation, setConversation] = useState<any>(null) // For tracking last_message_at
    const [listing, setListing] = useState<any>(null)
    const [showMenu, setShowMenu] = useState(false)
    const [selectedImages, setSelectedImages] = useState<File[]>([])
    const [previewUrls, setPreviewUrls] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const [loadingUser, setLoadingUser] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { mutate: markAsRead } = useMarkMessagesAsRead()


    // Fetch messages
    const fetchMessages = useCallback(async () => {
        if (!conversationId || !currentUserId) return

        try {
            // 🔥 CRITIQUE : Vérifier si user a supprimé cette conversation
            const { data: deletion } = await (supabase as any)
                .from('conversation_deletions')
                .select('deleted_at')
                .eq('conversation_id', conversationId)
                .eq('user_id', currentUserId)
                .maybeSingle()

            // Charger les messages
            let query = supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)

            // 🔥 CRITIQUE : Si supprimée, filtrer messages APRÈS deleted_at
            if (deletion?.deleted_at) {
                query = query.gt('created_at', deletion.deleted_at)
            }

            const { data, error } = await query
                .order('created_at', { ascending: true })
                .limit(500)  // ✅ Limit messages to prevent page crash

            if (error) throw error

            setMessages(data || [])
        } catch (error) {
            console.error('❌ Error fetching messages:', error)
        }
    }, [conversationId, currentUserId])

    // Fetch other user and listing
    const fetchOtherUser = useCallback(async () => {
        if (!conversationId || !currentUserId) return

        try {
            setLoadingUser(true) // Start loading

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

            // Save conversation data for header (including last_message_at)
            setConversation(conv)


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
        } finally {
            setLoadingUser(false) // Stop loading
        }
    }, [conversationId, currentUserId])

    // ❌ REALTIME DÉSACTIVÉ - Utiliser le polling de useMessages à la place
    // Le hook useMessages (ligne 197-250 dans useMessages.ts) fait déjà du polling
    // avec refetchInterval: 2000ms, ce qui assure l'affichage des messages
    // en quasi temps réel (2 secondes de délai max)
    /*
    // ✅ REALTIME ACTIVÉ - Messages en temps réel (sans filter pour éviter CHANNEL_ERROR)
    useEffect(() => {
        if (!conversationId || !currentUserId) return

        console.log('📡 [ChatWindow] Setting up Realtime subscription for:', conversationId)

        const channel = supabase
            .channel('messages-realtime') // ✅ Nom simple et générique
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                    // ❌ NO FILTER - Let client-side filter to avoid CHANNEL_ERROR
                },
                (payload) => {
                    console.log('📨 [ChatWindow] New message received:', payload.new)

                    const newMessage = payload.new as any

                    // ✅ Manual client-side filtering by conversation_id
                    if (newMessage.conversation_id !== conversationId) {
                        console.log('📨 [ChatWindow] Message not for this conversation, ignoring')
                        return
                    }

                    // Don't add own messages (already added via optimistic update)
                    if (newMessage.sender_id === currentUserId) {
                        console.log('📨 [ChatWindow] Own message, skipping (optimistic update)')
                        return
                    }

                    // Add message from other user
                    console.log('📨 [ChatWindow] Adding message from other user')
                    setMessages((prev) => {
                        // Avoid duplicates
                        const exists = prev.find(m => m.id === newMessage.id)
                        if (exists) {
                            console.log('📨 [ChatWindow] Message already exists, skipping')
                            return prev
                        }
                        return [...prev, newMessage]
                    })
                }
            )
            .subscribe((status) => {
                console.log('📡 [ChatWindow] Subscription status:', status)
            })

        return () => {
            console.log('📡 [ChatWindow] Cleaning up Realtime subscription')
            supabase.removeChannel(channel)
        }
    }, [conversationId, currentUserId])
    */

    // ✅ Fetch initial data + Polling every 2 seconds
    useEffect(() => {
        if (!conversationId) return

        fetchMessages()
        fetchOtherUser()

        // 🔥 CRITIQUE : Marquer les messages comme lus quand on ouvre la conversation
        markAsRead(conversationId)

        // Reset scroll tracker for new conversation
        isAtBottomRef.current = true

        // ✅ POLLING: Refetch messages every 2 seconds for real-time updates
        const pollingInterval = setInterval(() => {
            console.log('🔄 [ChatWindow] Polling for new messages...')
            fetchMessages()
        }, 2000) // 2 seconds

        return () => {
            clearInterval(pollingInterval)
        }
    }, [conversationId, currentUserId, fetchMessages, fetchOtherUser, markAsRead])

    const isAtBottomRef = useRef(true) // Default to true for first load

    // Handle scroll to track if user is at bottom
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
        // Tolerance of 10px
        const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10
        isAtBottomRef.current = isAtBottom
    }

    // Scroll to bottom when messages change
    useEffect(() => {
        // Only auto-scroll if there are many messages (3+)
        if (messages.length >= 3) {
            // Smart Auto-Scroll: Only scroll if user was already at bottom or it's the first load (implied by default true)
            // Note: We might want to force it on conversation change, but isAtBottomRef persists. 
            // Better strategy: Reset isAtBottomRef to true when conversationId changes? 
            // Actually, for this specific request: "if (isAtBottom || isFirstLoad)"

            if (isAtBottomRef.current) {
                scrollToBottom('auto')
            }
        }
    }, [messages])

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        // Use requestAnimationFrame to ensure scroll happens after render cycle
        requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior })
        })
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

            // 5. Update conversation with last_message preview and timestamps
            console.log('📝 [ChatWindow] Updating conversation:', conversationId)
            const { error: convUpdateError } = await supabase
                .from('conversations')
                .update({
                    updated_at: new Date().toISOString(),
                    last_message: messageContent || '📷 Image',
                    last_message_at: new Date().toISOString()
                })
                .eq('id', conversationId)

            if (convUpdateError) {
                console.error('❌ [ChatWindow] ERREUR UPDATE CONVERSATION:', convUpdateError)
                console.error('❌ Details:', {
                    conversationId,
                    messageContent,
                    currentUserId,
                    error: convUpdateError
                })
            } else {
                console.log('✅ [ChatWindow] Conversation updated successfully')
            }


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
        <div className="fixed inset-0 z-[9999] flex flex-col bg-white h-[100dvh] w-full overscroll-none md:static md:h-full md:w-auto md:z-auto">

            {/* ROW 1: Header - Auto height based on content */}
            <div className="flex-none z-[1000] border-b bg-white pointer-events-auto relative pt-[env(safe-area-inset-top)]">
                <ConversationHeader
                    otherUserName={otherUser?.name || 'Utilisateur'}
                    otherUserAvatar={otherUser?.avatar_url}
                    lastActivity={getRelativeTime(conversation?.last_message_at || conversation?.created_at || new Date().toISOString())}
                    onMenuClick={() => setShowMenu(!showMenu)}
                    onMobileBack={onMobileBack}
                    showMobileBack={true}
                    loading={loadingUser}
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
            </div>

            {/* ROW 2: Messages - Takes all remaining space (1fr) + Scrollable */}
            <div
                className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 relative bg-white pointer-events-auto"
                onScroll={handleScroll}
            >
                <div className="flex flex-col p-4 space-y-2">
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

            {/* ROW 3: Input - Auto height, stuck at bottom */}
            <div className="flex-none z-20 bg-white border-t px-4 py-3 w-full pointer-events-auto pb-safe">
                <div className="flex items-center gap-3">
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
        </div>
    )
}

export default ChatWindow
