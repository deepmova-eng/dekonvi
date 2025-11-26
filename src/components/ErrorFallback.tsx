import { useEffect } from 'react'
import * as Sentry from '@sentry/react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorFallbackProps {
    error?: Error
    resetError?: () => void
    eventId?: string
}

export const ErrorFallback = ({ error, resetError, eventId }: ErrorFallbackProps) => {
    useEffect(() => {
        // Logger l'erreur dans Sentry
        if (error) {
            Sentry.captureException(error)
        }
    }, [error])

    return (
        <div className="error-fallback">
            <div className="error-container">
                <AlertTriangle size={64} color="#EF4444" className="mx-auto mb-6" />

                <h1 className="text-2xl font-bold text-gray-900 mb-4">Oups ! Quelque chose s'est mal passé</h1>

                <p className="text-gray-500 mb-8">
                    Une erreur inattendue s'est produite. Nous avons été notifiés et
                    travaillons sur une solution.
                </p>

                {import.meta.env.DEV && error && (
                    <div className="bg-red-50 p-4 rounded-lg text-left mb-6 overflow-auto max-h-60">
                        <h3 className="text-red-700 font-bold text-sm mb-2">Détails de l'erreur (dev only):</h3>
                        <pre className="text-red-900 text-xs whitespace-pre-wrap break-words">{error.message}</pre>
                        <pre className="text-red-900 text-xs whitespace-pre-wrap break-words mt-2">{error.stack}</pre>
                    </div>
                )}

                {eventId && (
                    <p className="text-gray-400 text-xs mb-6">
                        ID de l'erreur : <code className="bg-gray-100 px-2 py-1 rounded">{eventId}</code>
                    </p>
                )}

                <div className="flex flex-wrap justify-center gap-3">
                    {resetError && (
                        <button
                            onClick={resetError}
                            className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors"
                        >
                            <RefreshCw size={20} />
                            Réessayer
                        </button>
                    )}

                    <button
                        onClick={() => window.location.href = '/'}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                        <Home size={20} />
                        Retour à l'accueil
                    </button>

                    <button
                        onClick={() => Sentry.showReportDialog({ eventId })}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                        Signaler le problème
                    </button>
                </div>
            </div>
        </div>
    )
}
