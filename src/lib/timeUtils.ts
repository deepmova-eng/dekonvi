// Helper function to calculate relative time
export function getRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 5) {
        return "En ligne"
    } else if (diffMins < 60) {
        return `Actif il y a ${diffMins} min`
    } else if (diffHours < 24) {
        return `Actif il y a ${diffHours}h`
    } else if (diffDays === 1) {
        return "Actif hier"
    } else if (diffDays < 7) {
        return `Actif il y a ${diffDays}j`
    } else {
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short'
        })
    }
}
