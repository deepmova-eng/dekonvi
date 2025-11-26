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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Group messages by sender
  const groupedMessages: Message[][] = [];
  let currentGroup: Message[] = [];

  messages.forEach((message, index) => {
    if (index === 0) {
      currentGroup.push(message);
    } else {
      const prevMessage = messages[index - 1];
      if (prevMessage.sender_id === message.sender_id) {
        currentGroup.push(message);
      } else {
        groupedMessages.push([...currentGroup]);
        currentGroup = [message];
      }
    }
  });

  if (currentGroup.length > 0) {
    groupedMessages.push(currentGroup);
  }

  return (
    <div className="messages-body">
      {groupedMessages.map((group, groupIndex) => {
        const isCurrentUser = group[0].sender_id === currentUser?.id;

        return (
          <div key={groupIndex} className="flex flex-col gap-1">
            {group.map((message) => (
              <div
                key={message.id}
                className={`message ${isCurrentUser ? 'sent' : 'received'}`}
              >
                <div className="message-bubble">
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}