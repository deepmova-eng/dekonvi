import { useRef, useEffect } from 'react'
import { MessageSquarePlus, Settings, HelpCircle } from 'lucide-react'
import './SidebarMenu.css'

interface Props {
    onClose: () => void
}

export function SidebarMenu({ onClose }: Props) {
    const menuRef = useRef<HTMLDivElement>(null)

    // Ferme le menu si on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [onClose])

    const handleNewMessage = () => {
        alert('Pour démarrer une conversation, cliquez sur "Contacter" depuis une annonce')
        onClose()
    }

    const handleSettings = () => {
        alert('Paramètres de notification (fonctionnalité à venir)')
        onClose()
    }

    const handleHelp = () => {
        window.open('/help/messaging', '_blank')
        onClose()
    }

    return (
        <div className="sidebar-menu" ref={menuRef}>
            <button className="menu-item" onClick={handleNewMessage}>
                <MessageSquarePlus size={18} />
                <span>Nouvelle conversation</span>
                <span className="menu-badge soon">Bientôt</span>
            </button>

            <div className="menu-divider" />

            <button className="menu-item" onClick={handleSettings}>
                <Settings size={18} />
                <span>Paramètres notifications</span>
                <span className="menu-badge soon">Bientôt</span>
            </button>

            <div className="menu-divider" />

            <button className="menu-item" onClick={handleHelp}>
                <HelpCircle size={18} />
                <span>Aide & Support</span>
            </button>
        </div>
    )
}
