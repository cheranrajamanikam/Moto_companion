import React from 'react';
import { AIMessage as AIMessageType } from '../types';
import { SparklesIcon, UserIcon } from './icons';
import { AIResponseCard } from './AIResponseCard';

interface AIMessageProps {
  message: AIMessageType;
  onViewMap?: (hazardId?: string) => void;
  onFindSaferRoute?: () => void;
}

export const AIMessage: React.FC<AIMessageProps> = ({
  message,
  onViewMap,
  onFindSaferRoute,
}) => {
  const isUser = message?.role === 'user';
  const timestampNum =
    typeof message?.timestamp === 'number' && !isNaN(message.timestamp)
      ? message.timestamp
      : Date.now();
  const timeFormatted = new Date(timestampNum).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const contentText =
    typeof message?.content === 'string'
      ? message.content
      : typeof message?.content === 'object' && message?.content !== null
      ? (message.content as any).text || (message.content as any).message || JSON.stringify(message.content)
      : String(message?.content || '');

  return (
    <div className={`chat-message-row ${isUser ? 'user' : 'assistant'}`}>
      {!isUser && (
        <div className="ai-avatar-icon" style={{ marginTop: 2, flexShrink: 0 }}>
          <SparklesIcon size={14} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '100%' }}>
        <div className="chat-bubble">
          <div>{contentText}</div>

          {/* Render structured cards if present */}
          {message.structuredCards && message.structuredCards.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {message.structuredCards.map((card, idx) => (
                <AIResponseCard
                  key={idx}
                  card={card}
                  onViewMap={onViewMap}
                  onFindSaferRoute={onFindSaferRoute}
                />
              ))}
            </div>
          )}
        </div>

        <span className="chat-timestamp">{timeFormatted}</span>
      </div>

      {isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginTop: 2,
            flexShrink: 0,
          }}
        >
          <UserIcon size={14} />
        </div>
      )}
    </div>
  );
};

export const AIMessageView = AIMessage;
