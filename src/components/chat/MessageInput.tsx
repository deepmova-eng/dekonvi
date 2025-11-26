import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import './MessageInput.css';

interface MessageInputProps {
  onSend: (content: string) => void;
}

export default function MessageInput({ onSend }: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="message-input-container">
      <div className="message-input-wrapper">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Écrivez un message..."
          className="message-input-field"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="message-send-button"
          aria-label="Envoyer"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}