import React, { useRef, useEffect } from 'react';
import { ChatMessage, ChatUser } from '../types';
import { ChatMessageItem } from './ChatMessageItem';
import { MessageSquareIcon } from './icons';

interface Props {
  messages: ChatMessage[];
  currentUser: ChatUser;
  isLoading: boolean;
  onDelete: (messageId: string) => void;
  onOpenReport: (messageId: string) => void;
  onOpenRiderProfile?: (userId: string) => void;
}

export const ChatMessageList: React.FC<Props> = ({
  messages,
  currentUser,
  isLoading,
  onDelete,
  onOpenReport,
  onOpenRiderProfile,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="chat-messages-container">
        <div className="chat-empty-state">
          <div className="chat-empty-icon">⏳</div>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>Connecting to Global Rider Lounge...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="chat-messages-container">
        <div className="chat-empty-state">
          <div className="chat-empty-icon">
            <MessageSquareIcon size={32} />
          </div>
          <p style={{ margin: 0, fontSize: '0.92rem', color: '#fff', fontWeight: 600 }}>
            No messages in this lounge yet.
          </p>
          <span style={{ fontSize: '0.8rem', color: 'var(--moto-text-secondary)' }}>
            Start the conversation and share corridor conditions with other riders!
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-messages-container">
      {messages.map((msg) => (
        <ChatMessageItem
          key={msg.id}
          message={msg}
          currentUser={currentUser}
          onDelete={onDelete}
          onOpenReport={onOpenReport}
          onOpenRiderProfile={onOpenRiderProfile}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};
