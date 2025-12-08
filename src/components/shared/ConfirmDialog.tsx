import { useEffect } from 'react';
import { X, Archive, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    danger = false
}: ConfirmDialogProps) {
    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Modal */}
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with close button */}
                <div className="relative p-6 pb-4">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Fermer"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>

                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                        <div className={`${danger ? 'bg-red-100' : 'bg-orange-100'} p-4 rounded-full`}>
                            {danger ? (
                                <AlertTriangle className="w-12 h-12 text-red-600" />
                            ) : (
                                <Archive className="w-12 h-12 text-orange-600" />
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                        {title}
                    </h3>

                    {/* Message */}
                    <p className="text-gray-600 text-center leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-6 pt-2 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all transform active:scale-95"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`flex-1 px-6 py-3 text-white font-semibold rounded-lg transition-all shadow-lg transform active:scale-95 ${danger
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-orange-600 hover:bg-orange-700'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
