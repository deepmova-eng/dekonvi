import { useEffect, useRef } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import type { Database } from '../../types/supabase';
import '../../notifications-messages.css';

type Message = Database['public']['Tables']['messages']['Row'];

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useSupabase();

  // DEBUG: Check if messages are received
  console.log('💬 [MessageList] Rendering, messages count:', messages?.length);

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

  // SIMPLIFIED RENDERING FOR DEBUG - No grouping
  return (
    <div className="messages-body">
      {messages.map((message) => {
        const isCurrentUser = message.sender_id === currentUser?.id;

        return (
          <div
            key={message.id}
            className={`message ${isCurrentUser ? 'sent' : 'received'}`}
            style={{
              marginBottom: '8px',
              padding: '12px',
              backgroundColor: isCurrentUser ? '#2DD181' : '#ffffff',
              color: isCurrentUser ? 'white' : 'black',
              borderRadius: '12px',
              maxWidth: '70%',
              alignSelf: isCurrentUser ? 'flex-end' : 'flex-start'
            }}
          >
            {message.content}
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}