import React, { useState } from 'react';
import { X, Flag, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSupabase } from '../../contexts/SupabaseContext';
import toast from 'react-hot-toast';

interface ReportModalProps {
    targetType: 'listing' | 'user';
    targetId: string;
    targetName: string; // Pour affichage (titre annonce ou nom user)
    onClose: () => void;
}

const reasonOptions = [
    { value: 'scam', label: 'Arnaque / Escroquerie', icon: '🚨' },
    { value: 'spam', label: 'Spam', icon: '📧' },
    { value: 'inappropriate', label: 'Contenu inapproprié', icon: '⚠️' },
    { value: 'other', label: 'Autre', icon: '🔍' }
];

export default function ReportModal({ targetType, targetId, targetName, onClose }: ReportModalProps) {
    const { user } = useSupabase();
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedReason) {
            toast.error('Veuillez sélectionner un motif');
            return;
        }

        if (!user) {
            toast.error('Vous devez être connecté pour signaler');
            return;
        }

        setIsSubmitting(true);

        try {
            const reportData: any = {
                reporter_id: user.id,
                target_type: targetType,
                reason: selectedReason,
                description: description || '',
                status: 'pending'
            };

            // Set listing_id or reported_user_id based on target_type
            if (targetType === 'listing') {
                reportData.listing_id = targetId;
                reportData.reported_user_id = null;
            } else {
                reportData.reported_user_id = targetId;
                reportData.listing_id = null;
            }

            const { error } = await supabase
                .from('reports')
                .insert(reportData);

            if (error) throw error;

            toast.success('Signalement envoyé. Notre équipe va examiner cela rapidement.');
            onClose();
        } catch (error) {
            console.error('Error submitting report:', error);
            toast.error('Erreur lors de l\'envoi du signalement');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Signaler</h3>
                        <p className="text-sm text-gray-600 mt-1">{targetName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                        Votre signalement sera examiné par notre équipe dans les plus brefs délais.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Reason Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">
                            Pourquoi signalez-vous {targetType === 'listing' ? 'cette annonce' : 'cet utilisateur'} ?
                        </label>
                        <div className="space-y-2">
                            {reasonOptions.map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedReason === option.value
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="reason"
                                        value={option.value}
                                        checked={selectedReason === option.value}
                                        onChange={(e) => setSelectedReason(e.target.value)}
                                        className="w-5 h-5 text-primary-600"
                                    />
                                    <span className="text-2xl">{option.icon}</span>
                                    <span className="font-medium text-gray-900">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Description (Optional) */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
                            Description (optionnelle)
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            maxLength={500}
                            placeholder="Ajoutez des détails supplémentaires si nécessaire..."
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-0 resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            {description.length}/500 caractères
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedReason || isSubmitting}
                            className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <Flag className="w-5 h-5" />
                                    Envoyer
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
