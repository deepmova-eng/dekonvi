import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    useTicketMessages,
    useSendMessage,
    useUpdateTicketStatus,
    useAllTickets,
    useUserTickets,
    useMarkTicketAsRead,
    TicketStatus,
    TicketSubject
} from '../../hooks/useSupport';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { useSupabase } from '../../contexts/SupabaseContext';

interface TicketConversationProps {
    ticketId: string;
    onBack: () => void;
    isUserView?: boolean; // Mode user : pas de changement de status
}

// Labels pour les sujets et statuts
const subjectLabels: Record<TicketSubject, string> = {
    validation_issue: 'Problème de validation',
    technical_bug: 'Bug technique',
    billing: 'Problème de paiement',
    other: 'Autre question'
};

const subjectIcons: Record<TicketSubject, string> = {
    validation_issue: '🔒',
    technical_bug: '🐞',
    billing: '💳',
    other: '🔍'
};

const statusLabels: Record<TicketStatus, string> = {
    open: 'Ouvert',
    in_progress: 'En cours',
    resolved: 'Résolu',
    closed: 'Fermé'
};

const statusColors: Record<TicketStatus, string> = {
    open: 'bg-green-100 text-green-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-purple-100 text-purple-700',
    closed: 'bg-gray-100 text-gray-700'
};

export default function TicketConversation({ ticketId, onBack, isUserView = false }: TicketConversationProps) {
    const { user } = useSupabase();

    // Use correct hook based on view mode
    const { data: adminTickets = [] } = useAllTickets();
    const { data: userTickets = [] } = useUserTickets();
    const tickets = isUserView ? userTickets : adminTickets;
    const ticket = tickets.find(t => t.id === ticketId);

    // Auto-refresh messages every 3 seconds for real-time updates
    const { data: messages = [], isLoading } = useTicketMessages(ticketId);
    const { mutate: sendMessage } = useSendMessage();
    const { mutate: updateStatus } = useUpdateTicketStatus();
    const { mutate: markAsRead } = useMarkTicketAsRead();

    const [reply, setReply] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Mark as read when opening conversation
    useEffect(() => {
        markAsRead({ ticketId, isAdmin: !isUserView });
    }, [ticketId, isUserView, markAsRead]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Check if ticket is closed (read-only)
    const isTicketClosed = ticket?.status === 'closed';

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reply.trim() || isSending) return;

        setIsSending(true);

        sendMessage(
            { ticketId, message: reply },
            {
                onSuccess: () => {
                    setReply('');
                },
                onSettled: () => {
                    setIsSending(false);
                }
            }
        );
    };

    const handleStatusChange = (newStatus: TicketStatus) => {
        updateStatus({ ticketId, status: newStatus });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="text-center py-16">
                <p className="text-gray-600">Ticket introuvable</p>
                <button onClick={onBack} className="mt-4 text-blue-600 hover:underline">
                    Retour à la liste
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] bg-gray-50 rounded-xl border border-gray-200">

            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between gap-4">
                    {/* Left: Back + Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </button>

                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-2xl flex-shrink-0">{subjectIcons[ticket.subject]}</span>
                            <div className="flex-1 min-w-0">
                                <h2 className="font-bold text-gray-900 truncate">
                                    {subjectLabels[ticket.subject]}
                                </h2>
                                <p className="text-xs text-gray-500 truncate">
                                    Par {ticket.user?.name || 'Utilisateur'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Status dropdown (Admin only) */}
                    {!isUserView ? (
                        <select
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 cursor-pointer ${statusColors[ticket.status]} hover:opacity-80 transition-opacity`}
                        >
                            <option value="open">Ouvert</option>
                            <option value="in_progress">En cours</option>
                            <option value="resolved">Résolu</option>
                            <option value="closed">Fermé</option>
                        </select>
                    ) : (
                        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${statusColors[ticket.status]}`}>
                            {statusLabels[ticket.status].toUpperCase()}
                        </div>
                    )}
                </div>
            </div>

            {/* Messages - WhatsApp style */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => {
                    const isAdmin = msg.sender?.role === 'admin';
                    const isCurrentUser = msg.sender_id === user?.id;

                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-2xl px-4 py-3 ${isAdmin
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white text-gray-900 border border-gray-200'
                                    }`}
                            >
                                {/* Sender name (si pas admin actuel) */}
                                {!isCurrentUser && (
                                    <p className={`text-xs font-semibold mb-1 ${isAdmin ? 'text-blue-100' : 'text-gray-600'}`}>
                                        {msg.sender?.name || 'Utilisateur'}
                                    </p>
                                )}

                                {/* Message */}
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                    {msg.message}
                                </p>

                                {/* Time */}
                                <p className={`text-xs mt-1.5 ${isAdmin ? 'text-blue-100' : 'text-gray-500'}`}>
                                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Reply Input - Sticky bottom */}
            <div className="bg-white border-t border-gray-200 p-4">
                {isTicketClosed ? (
                    /* Closed ticket message */
                    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 text-center">
                        <p className="text-sm font-semibold text-gray-700 mb-1">
                            🔒 Ce ticket est fermé
                        </p>
                        <p className="text-xs text-gray-500">
                            Les tickets fermés sont archivés. Pour toute nouvelle question, veuillez ouvrir un nouveau ticket.
                        </p>
                    </div>
                ) : (
                    /* Active reply form */
                    <>
                        <form onSubmit={handleSendReply} className="flex gap-3">
                            <textarea
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                placeholder="Écrivez votre réponse..."
                                rows={2}
                                disabled={isTicketClosed}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendReply(e);
                                    }
                                }}
                            />
                            <button
                                type="submit"
                                disabled={!reply.trim() || isSending || isTicketClosed}
                                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {isSending ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Send className="h-5 w-5" />
                                )}
                            </button>
                        </form>
                        <p className="text-xs text-gray-500 mt-2">
                            Appuyez sur Entrée pour envoyer, Shift+Entrée pour un saut de ligne
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
