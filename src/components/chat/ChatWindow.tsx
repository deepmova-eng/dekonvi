import { MessageCircle } from 'lucide-react';
import Conversation from './Conversation';
import './ChatWindow.css';

interface Props {
    conversationId: string | null;
}

export function ChatWindow({ conversationId }: Props) {
    if (!conversationId) {
        return (
            <div className="chat-window empty">
                <div className="empty-state">
                    <div className="empty-icon">
                        <MessageCircle size={64} />
                    </div>
                    <h3>Sélectionnez une conversation</h3>
                    <p>Choisissez une conversation dans la liste pour commencer à discuter</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-window">
            <Conversation conversationId={conversationId} onBack={() => { }} />
        </div>
    );
}
