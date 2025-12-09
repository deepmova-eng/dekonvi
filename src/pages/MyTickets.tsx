import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, PlusCircle, MessageCircle, Archive } from 'lucide-react';
import { useUserTickets, hasUnreadMessages, useArchiveTicket } from '../hooks/useSupport';
import ContactSupportModal from '../components/shared/ContactSupportModal';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import TicketConversation from '../components/admin/TicketConversation';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function MyTickets() {
    const navigate = useNavigate();
    const [showContactModal, setShowContactModal] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [showConfirmArchive, setShowConfirmArchive] = useState(false);
    const [ticketToArchive, setTicketToArchive] = useState<string | null>(null);

    const { data: tickets = [], isLoading } = useUserTickets();
    const { mutate: archiveTicket } = useArchiveTicket();

    // Subject icons & labels
    const subjectIcons: Record<string, string> = {
        validation_issue: '🔒',
        technical_bug: '🐞',
        billing: '💳',
        other: '🔍'
    };

    const subjectLabels: Record<string, string> = {
        validation_issue: 'Problème de validation',
        technical_bug: 'Bug technique',
        billing: 'Problème de paiement',
        other: 'Autre question'
    };

    const statusColors: Record<string, string> = {
        open: 'bg-green-100 text-green-800 border-green-300',
        in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        resolved: 'bg-purple-100 text-purple-800 border-purple-300',
        closed: 'bg-gray-100 text-gray-800 border-gray-300'
    };

    const statusLabels: Record<string, string> = {
        open: 'Ouvert',
        in_progress: 'En cours',
        resolved: 'Résolu',
        closed: 'Fermé'
    };

    // Si conversation ouverte, afficher TicketConversation
    if (selectedTicketId) {
        return (
            <TicketConversation
                ticketId={selectedTicketId}
                onBack={() => setSelectedTicketId(null)}
                isUserView={true}
            />
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Mes demandes</h1>
                                <p className="text-sm text-gray-600">Historique de vos tickets support</p>
                            </div>
                        </div>

                        {/* CTA - Nouveau ticket */}
                        <button
                            onClick={() => setShowContactModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <PlusCircle className="w-5 h-5" />
                            <span className="hidden sm:inline">Nouveau ticket</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : tickets.length === 0 ? (
                    // Empty state
                    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                        <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Aucune demande pour le moment
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Vous n'avez pas encore contacté notre équipe support.
                        </p>
                        <button
                            onClick={() => setShowContactModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <PlusCircle className="w-5 h-5" />
                            Créer mon premier ticket
                        </button>
                    </div>
                ) : (
                    // Tickets list
                    <div className="space-y-4">
                        {/* Info banner */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                            <MessageCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-900">
                                <p className="font-semibold mb-1">Vous serez notifié par email</p>
                                <p>
                                    Dès qu'un administrateur répondra à l'une de vos demandes, vous recevrez une notification par email.
                                </p>
                            </div>
                        </div>

                        {/* Tickets */}
                        {tickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                onClick={() => setSelectedTicketId(ticket.id)}
                                className="bg-white rounded-xl border-2 border-gray-100 hover:border-blue-300 transition-all cursor-pointer shadow-sm hover:shadow-md p-4"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <span className="text-3xl flex-shrink-0">{subjectIcons[ticket.subject]}</span>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">
                                                {subjectLabels[ticket.subject]}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Ticket #{ticket.id.slice(0, 6).toUpperCase()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        {/* Status badge */}
                                        <div
                                            className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold border-2 ${statusColors[ticket.status]}`}
                                        >
                                            {statusLabels[ticket.status].toUpperCase()}
                                        </div>

                                        {/* Unread badge */}
                                        {hasUnreadMessages(ticket, false) && (
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 border-2 border-red-300 rounded-full">
                                                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                                                <span className="text-xs font-bold text-red-700">NOUVEAU</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <p className="text-sm text-gray-500">
                                            {formatDistanceToNow(new Date(ticket.updated_at), {
                                                addSuffix: true,
                                                locale: fr
                                            })}
                                        </p>

                                        {/* Archive button - Only visible for CLOSED tickets */}
                                        {ticket.status === 'closed' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTicketToArchive(ticket.id);
                                                    setShowConfirmArchive(true);
                                                }}
                                                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
                                                title="Archiver ce ticket fermé"
                                            >
                                                <Archive className="h-4 w-4" />
                                                <span className="hidden sm:inline">Archiver</span>
                                            </button>
                                        )}
                                    </div>

                                    <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                                        Voir la conversation →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Contact Support Modal */}
            {showContactModal && (
                <ContactSupportModal onClose={() => setShowContactModal(false)} />
            )}

            {/* Archive Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showConfirmArchive}
                onClose={() => {
                    setShowConfirmArchive(false);
                    setTicketToArchive(null);
                }}
                onConfirm={() => {
                    if (ticketToArchive) {
                        archiveTicket({ ticketId: ticketToArchive, isAdmin: false });
                    }
                }}
                title="Archiver ce ticket ?"
                message="Ce ticket fermé sera caché de votre liste mais restera accessible à l'équipe support pour consultation."
                confirmText="Archiver"
                cancelText="Annuler"
                danger={false}
            />
        </div>
    );
}
