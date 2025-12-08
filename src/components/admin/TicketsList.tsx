import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAllTickets, TicketSubject, TicketStatus, hasUnreadMessages } from '../../hooks/useSupport';
import { AlertTriangle, Loader2 } from 'lucide-react';
import TicketConversation from './TicketConversation';

// Labels et icônes pour les sujets
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

// Labels et couleurs pour les statuts
const statusLabels: Record<TicketStatus, string> = {
    open: 'Ouvert',
    in_progress: 'En cours',
    resolved: 'Résolu',
    closed: 'Fermé'
};

const statusColors: Record<TicketStatus, string> = {
    open: 'bg-green-100 text-green-700 border-green-200',
    in_progress: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    resolved: 'bg-purple-100 text-purple-700 border-purple-200',
    closed: 'bg-gray-100 text-gray-700 border-gray-200'
};

export default function TicketsList() {
    const { data: tickets = [], isLoading } = useAllTickets();
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');

    // Filtrer les tickets
    const filteredTickets = statusFilter === 'all'
        ? tickets
        : tickets.filter(t => t.status === statusFilter);

    // Compter les tickets ouverts pour le badge
    const openTicketsCount = tickets.filter(t => t.status === 'open').length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    // Si un ticket est sélectionné, afficher la conversation
    if (selectedTicketId) {
        return (
            <TicketConversation
                ticketId={selectedTicketId}
                onBack={() => setSelectedTicketId(null)}
            />
        );
    }

    return (
        <div className="space-y-6">

            {/* Header avec filtres */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        Support Client
                        {openTicketsCount > 0 && (
                            <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-bold text-white bg-blue-600 rounded-full">
                                {openTicketsCount}
                            </span>
                        )}
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Gérez les demandes d'assistance des utilisateurs
                    </p>
                </div>

                {/* Filtres status */}
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Tous ({tickets.length})
                    </button>
                    {(['open', 'in_progress', 'resolved'] as TicketStatus[]).map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {statusLabels[status]} ({tickets.filter(t => t.status === status).length})
                        </button>
                    ))}
                </div>
            </div>

            {/* Liste des tickets */}
            {filteredTickets.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
                    <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Aucun ticket
                    </h3>
                    <p className="text-gray-600">
                        {statusFilter === 'all'
                            ? 'Aucune demande de support pour le moment.'
                            : `Aucun ticket ${statusLabels[statusFilter as TicketStatus].toLowerCase()}.`
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTickets.map(ticket => (
                        <div
                            key={ticket.id}
                            className="bg-white rounded-xl border-2 border-gray-100 hover:border-blue-300 transition-all cursor-pointer shadow-sm hover:shadow-md"
                            onClick={() => setSelectedTicketId(ticket.id)}
                        >
                            {/* Header avec badge status */}
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 ${statusColors[ticket.status]}`}>
                                    <span>{statusLabels[ticket.status].toUpperCase()}</span>
                                </div>

                                {/* Unread badge */}
                                {hasUnreadMessages(ticket, true) && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 border-2 border-red-300 rounded-full">
                                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                                        <span className="text-xs font-bold text-red-700">NOUVEAU</span>
                                    </div>
                                )}
                            </div>

                            {/* Body */}
                            <div className="p-4 space-y-3">
                                {/* Icon + Subject */}
                                <div className="flex items-start gap-3">
                                    <span className="text-3xl flex-shrink-0">{subjectIcons[ticket.subject]}</span>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 text-base leading-tight">
                                            {subjectLabels[ticket.subject]}
                                        </h3>
                                    </div>
                                </div>

                                {/* User Info */}
                                <div className="flex items-center gap-2">
                                    {ticket.user?.avatar_url ? (
                                        <img
                                            src={ticket.user.avatar_url}
                                            alt={ticket.user.name}
                                            className="w-8 h-8 rounded-full"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                            <span className="text-gray-600 font-semibold text-sm">
                                                {ticket.user?.name?.[0]?.toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {ticket.user?.name || 'Utilisateur'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: fr })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 pt-0">
                                <button className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg transition-colors text-sm">
                                    Voir / Répondre
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
