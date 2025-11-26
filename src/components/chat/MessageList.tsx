import { useEffect, useRef } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import './MessageList.css';
import type { Database } from '../../types/supabase';

type Message = Database['public']['Tables']['messages']['Row'];

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useSupabase();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="messages-body">
        <div className="text-center text-gray-500 py-8">
          Aucun message pour le moment. Commencez la conversation !
        </div>
        <div ref={messagesEndRef} />
      </div>
    );
  }

  return (
    <div className="messages-body">
      {messages.map((message) => {
        const isCurrentUser = message.sender_id === currentUser?.id;

        return (
          <div
            key={message.id}
            className={`message ${isCurrentUser ? 'sent' : 'received'}`}
          >
            <div className="message-bubble">
              <p className="message-text">{message.content}</p>
              <span className="message-time">
                {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}