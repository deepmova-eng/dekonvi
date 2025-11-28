interface MessageBubbleProps {
    content: string
    isOwn: boolean
    timestamp: string
    images?: string[]
    isSending?: boolean
    readAt?: string | null
    deliveredAt?: string | null
}

export function MessageBubble({
    content,
    isOwn,
    timestamp,
    images = [],
    isSending = false,
    readAt,
    deliveredAt
}: MessageBubbleProps) {

    // Determine message status
    const getMessageStatus = () => {
        if (isSending) return { icon: '⏱', color: 'text-gray-400' }
        if (readAt) return { icon: '✓✓', color: 'text-emerald-500' }
        if (deliveredAt) return { icon: '✓✓', color: 'text-gray-400' }
        return { icon: '✓', color: 'text-gray-400' }
    }

    const status = getMessageStatus()

    return (
        <div
            className={`
                flex flex-col 
                ${isOwn ? 'items-end ml-auto' : 'items-start mr-auto'} 
                max-w-sm
                animate-fadeIn
            `}
        >
            {/* Bulle de message */}
            <div
                className={`
                    px-3 py-2 
                    rounded-2xl 
                    inline-block
                    max-w-full
                    break-words
                    ${isOwn
                        ? 'bg-emerald-50 text-gray-900 rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                    }
                    ${isSending ? 'opacity-60' : ''}
                `}
            >
                {/* Images si présentes */}
                {images.length > 0 && (
                    <div className="flex flex-col gap-1 mb-2">
                        {images.map((imageUrl, idx) => (
                            <img
                                key={idx}
                                src={imageUrl}
                                alt={`Image ${idx + 1}`}
                                className="max-w-[300px] max-h-[400px] md:max-w-[300px] sm:max-w-[200px] sm:max-h-[300px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(imageUrl, '_blank')}
                            />
                        ))}
                    </div>
                )}

                {/* Contenu texte */}
                {content && content !== '📷 Image' && (
                    <p className="text-[15px] leading-[1.5] whitespace-pre-wrap m-0">
                        {content}
                    </p>
                )}
            </div>

            {/* Timestamp */}
            <span
                className={`
                    text-xs text-gray-400 mt-1 px-1 flex items-center gap-1
                    ${isOwn ? 'text-right flex-row-reverse' : 'text-left'}
                `}
            >
                <span>{timestamp}</span>
                {isOwn && (
                    <span className={`text-xs ${status.color}`}>
                        {status.icon}
                    </span>
                )}
            </span>
        </div>
    )
}
