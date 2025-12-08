import React, { useState } from 'react';
import { X, Send, AlertCircle, Info } from 'lucide-react';
import { useCreateTicket, useUserTickets, TicketSubject } from '../../hooks/useSupport';

interface ContactSupportModalProps {
    onClose: () => void;
}

// Labels et icons pour les sujets
const subjectOptions = [
    { value: 'validation_issue' as TicketSubject, label: 'Problème de validation', icon: '🔒' },
    { value: 'technical_bug' as TicketSubject, label: 'Bug technique', icon: '🐞' },
    { value: 'billing' as TicketSubject, label: 'Problème de paiement', icon: '💳' },
    { value: 'other' as TicketSubject, label: 'Autre question', icon: '🔍' }
];

export default function ContactSupportModal({ onClose }: ContactSupportModalProps) {
    const [subject, setSubject] = useState<TicketSubject | ''>('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { mutate: createTicket } = useCreateTicket();
    const { data: userTickets = [] } = useUserTickets();

    // Check if user has an existing open or in_progress ticket
    const hasActiveTicket = userTickets.some(
        (ticket) => ticket.status === 'open' || ticket.status === 'in_progress'
    );
    const activeTicket = userTickets.find(
        (ticket) => ticket.status === 'open' || ticket.status === 'in_progress'
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!subject || !message.trim()) {
            return;
        }

        setIsSubmitting(true);

        createTicket(
            { subject: subject as TicketSubject, message },
            {
                onSuccess: () => {
                    onClose();
                },
                onSettled: () => {
                    setIsSubmitting(false);
                }
            }
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-[9999]">
            {/* Mobile: Full Screen (h-[100dvh]), Desktop: Centered Modal */}
            <div className="bg-white w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:rounded-2xl md:max-w-2xl overflow-y-auto shadow-2xl">

                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Contactez le support</h2>
                        <p className="text-xs md:text-sm text-gray-600 mt-1">Nous vous répondrons sous 24h</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                        aria-label="Fermer"
                    >
                        <X className="h-6 w-6 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6 pb-32 md:pb-6">

                    {/* Sujet */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Sujet de votre demande *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {subjectOptions.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setSubject(option.value)}
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${subject === option.value
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-2xl">{option.icon}</span>
                                    <span className="text-sm font-medium text-gray-900">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Décrivez votre problème *
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={6}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Expliquez en détail ce qui ne fonctionne pas..."
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            {message.length} caractères
                        </p>
                    </div>

                    {/* Info banner */}
                    {/* Benevolent Anti-Spam Message */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900">
                            <p className="font-semibold mb-1">💡 Pour un traitement plus rapide</p>
                            <p>
                                Merci de ne pas multiplier les demandes. Une seule suffit !
                                Notre équipe traite les tickets par ordre d'arrivée sous 24h.
                            </p>
                        </div>
                    </div>

                    {/* Active Ticket Warning (if exists) */}
                    {hasActiveTicket && activeTicket && (
                        <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-orange-900 mb-1">
                                    Vous avez déjà une demande en cours de traitement
                                </p>
                                <p className="text-sm text-orange-800 mb-2">
                                    Ticket #{activeTicket.id.slice(0, 6).toUpperCase()} ({activeTicket.status === 'open' ? 'Ouvert' : 'En cours'})
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        window.location.href = '/my-tickets';
                                    }}
                                    className="text-sm font-semibold text-orange-700 hover:text-orange-900 underline"
                                >
                                    → Voir mon ticket existant
                                </button>
                            </div>
                        </div>
                    )}

                </form>

                {/* Footer - Fixed on Mobile, Sticky on Desktop */}
                <div className="fixed md:sticky bottom-0 left-0 right-0 bg-white md:bg-gray-50 border-t border-gray-200 p-4 md:p-6 flex items-center justify-end gap-4 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 md:px-6 py-3 text-gray-700 font-semibold hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!subject || !message.trim() || isSubmitting || hasActiveTicket}
                        className="flex items-center gap-2 px-6 md:px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title={hasActiveTicket ? "Vous avez déjà un ticket en cours" : ""}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                <span>Envoi...</span>
                            </>
                        ) : (
                            <>
                                <Send className="h-5 w-5" />
                                <span>Envoyer</span>
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
