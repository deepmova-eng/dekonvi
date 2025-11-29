import { useEffect } from 'react'
import { X } from 'lucide-react'
import './ConfirmDialog.css'

interface ConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    danger?: boolean
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
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const handleConfirm = () => {
        onConfirm()
        onClose()
    }

    return (
        <div className="confirm-dialog-overlay" onClick={onClose}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="confirm-dialog-header">
                    <h3>{title}</h3>
                    <button
                        className="confirm-dialog-close"
                        onClick={onClose}
                        aria-label="Fermer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="confirm-dialog-content">
                    <p>{message}</p>
                </div>

                {/* Actions */}
                <div className="confirm-dialog-actions">
                    <button
                        className="confirm-dialog-btn confirm-dialog-btn-cancel"
                        onClick={onClose}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`confirm-dialog-btn ${danger ? 'confirm-dialog-btn-danger' : 'confirm-dialog-btn-confirm'}`}
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
