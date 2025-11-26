import React, { useState, useEffect } from 'react';
import { ChevronLeft, MessageSquare } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import ConversationList from '../components/chat/ConversationList';
import Conversation from '../components/chat/Conversation';
import NewConversation from '../components/chat/NewConversation';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import type { Conversation as ConversationType } from '../types/chat';
import '../notifications-messages.css';

interface MessagesProps {
  selectedConversationId?: string | null;
  onConversationSelect: (id: string | null) => void;
  onBack: () => void;
}

export default function Messages({
  selectedConversationId,
  onConversationSelect,
  onBack
}: MessagesProps) {
  const [showNewConversation, setShowNewConversation] = useState(false);

  const handleNewConversationSelect = (conversation: ConversationType) => {
    onConversationSelect(conversation.id);
    setShowNewConversation(false);
  };

  return (
    <div className="messages-page-container">
      {/* Sidebar */}
      <div className={`conversations-sidebar ${selectedConversationId ? 'hidden md:flex' : 'flex w-full md:w-auto'}`}>
        <div className="conversations-header flex justify-between items-center">
          <h2>Messages</h2>
          <button
            onClick={() => setShowNewConversation(true)}
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            + Nouveau
          </button>
        </div>

        <div className="conversations-list">
          {showNewConversation ? (
            <div className="p-4">
              <button
                onClick={() => setShowNewConversation(false)}
                className="mb-4 flex items-center text-gray-500 hover:text-gray-700"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Retour
              </button>
              <NewConversation onSelect={handleNewConversationSelect} />
            </div>
          ) : (
            <ConversationList
              selectedId={selectedConversationId}
              onSelectConversation={(conversation) => {
                onConversationSelect(conversation.id);
              }}
            />
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className={`messages-area ${!selectedConversationId ? 'hidden md:flex' : 'flex w-full md:w-auto'}`}>
        {selectedConversationId ? (
          <Conversation
            conversationId={selectedConversationId}
            onBack={() => onConversationSelect(null)}
          />
        ) : <div className="messages-empty-state">
          <div className="empty-icon">
            <MessageSquare />
          </div>
          <h3>Vos messages</h3>
          <p>Sélectionnez une conversation pour commencer à discuter</p>
          <button
            className="btn-browse-listings"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('setActiveTab', { detail: 'search' }));
              onBack(); // Navigate back/reset view
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Parcourir les annonces
          </button>
        </div>
        }
      </div>
    </div>

  );
}