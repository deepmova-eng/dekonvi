export function formatTimestamp(date: string | undefined | null): string {
    if (!date) return '';

    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins}min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays === 1) return "Hier"
    if (diffDays < 7) return `Il y a ${diffDays}j`
    return then.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
