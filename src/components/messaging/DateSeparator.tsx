interface DateSeparatorProps {
    date: string // ISO format
}

export function DateSeparator({ date }: DateSeparatorProps) {
    const formatDate = (dateString: string): string => {
        const messageDate = new Date(dateString)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        // Reset time to compare dates only
        const resetTime = (d: Date) => {
            d.setHours(0, 0, 0, 0)
            return d
        }

        const msgDate = resetTime(new Date(messageDate))
        const todayDate = resetTime(new Date(today))
        const yesterdayDate = resetTime(new Date(yesterday))

        if (msgDate.getTime() === todayDate.getTime()) {
            return "Aujourd'hui"
        } else if (msgDate.getTime() === yesterdayDate.getTime()) {
            return "Hier"
        } else {
            return messageDate.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            })
        }
    }

    return (
        <div className="flex justify-center my-4">
            <span className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                {formatDate(date)}
            </span>
        </div>
    )
}
