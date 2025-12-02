import React from 'react'

interface MessageBubbleProps {
    content: string
    isOwn: boolean
    timestamp: string
    images?: string[]
    isSending?: boolean
    readAt?: string | null
    deliveredAt?: string | null
}

export const MessageBubble = React.memo(function MessageBubble({
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
                max-w-[280px] sm:max-w-md
                animate-fadeIn
            `}
        >
            {/* Bulle de message - Plus organique et moderne */}
            <div
                className={`
                    px-5 py-3 
                    rounded-3xl 
                    inline-block
                    max-w-full
                    break-words
                    ${isOwn
                        ? 'bg-[#2DD181] text-white rounded-tr-none'
                        : 'bg-[#f3f4f6] text-gray-800 rounded-tl-none'
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
                                className="w-[280px] h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity bg-gray-100"
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
})
