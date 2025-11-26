
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ConversationList from '../chat/ConversationList';

export default function UserMessages() {
  const navigate = useNavigate();

  console.log('🔍 [Profile Messages Tab] Rendering ConversationList');

  return (
    <div className="bg-white rounded-lg shadow">
      <ConversationList
        onSelectConversation={(conversation) => {
          console.log('🔍 [Profile Messages Tab] Selected conversation:', conversation.id);
          navigate('/messages', { state: { conversationId: conversation.id } });
        }}
      />
    </div>
  );
}