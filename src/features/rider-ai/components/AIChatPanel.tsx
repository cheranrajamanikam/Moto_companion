import React, { useRef, useEffect } from 'react';
import { AIMessage as AIMessageType, AIStatusInfo } from '../types';
import { AIMessage } from './AIMessage';
import { AIThinkingIndicator } from './AIThinkingIndicator';
import { AIQuickActions } from './AIQuickActions';
import { AIMessageComposer } from './AIMessageComposer';
import { RiderAIErrorBoundary } from './RiderAIErrorBoundary';
import { SparklesIcon } from './icons';

interface AIChatPanelProps {
  messages: AIMessageType[];
  isThinking?: boolean;
  statusInfo?: AIStatusInfo;
  isRateLimited?: boolean;
  rateLimitSecondsRemaining?: number;
  onSendMessage: (text: string) => void;
  onViewMap?: (hazardId?: string) => void;
  onFindSaferRoute?: () => void;
  onResetConversation?: () => void;
}

const DEFAULT_STATUS_INFO: AIStatusInfo = {
  state: 'ready',
  label: 'Online · Ready',
  dotColor: '#10b981',
  textColor: '#10b981',
  bgColor: 'rgba(16, 185, 129, 0.1)',
  borderColor: 'rgba(16, 185, 129, 0.25)',
};

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  messages,
  isThinking = false,
  statusInfo = DEFAULT_STATUS_INFO,
  isRateLimited = false,
  rateLimitSecondsRemaining = 0,
  onSendMessage,
  onViewMap,
  onFindSaferRoute,
  onResetConversation,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const composerPlaceholder = isRateLimited
    ? `Rate limited (please wait ${rateLimitSecondsRemaining}s)...`
    : 'Type your route or hazard question...';

  return (
    <div className="ai-chat-panel">
      {/* Panel Top Header */}
      <div className="ai-chat-header">
        <div className="ai-chat-header-title">
          <div className="ai-avatar-icon">
            <SparklesIcon size={15} />
          </div>
          <span className="ai-chat-header-name">Rider AI Co-Pilot</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onResetConversation && (
            <button
              type="button"
              onClick={onResetConversation}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--moto-border-subtle)',
                borderRadius: 'var(--moto-radius-sm)',
                color: 'var(--moto-text-muted)',
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '3px 8px',
                cursor: 'pointer',
                fontFamily: 'var(--moto-font-body)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = 'var(--moto-border-medium)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--moto-text-muted)';
                e.currentTarget.style.borderColor = 'var(--moto-border-subtle)';
              }}
              title="Reset conversation and restore welcome state"
            >
              Reset Chat
            </button>
          )}

          <span
            className="ai-chat-status-pill"
            style={{
              color: statusInfo.textColor,
              backgroundColor: statusInfo.bgColor,
              borderColor: statusInfo.borderColor,
            }}
            title={
              statusInfo.retryAfterSeconds
                ? `Rate limit cooldown: ${statusInfo.retryAfterSeconds}s remaining`
                : `AI Co-Pilot Status: ${statusInfo.label}`
            }
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: statusInfo.dotColor,
                display: 'inline-block',
                boxShadow: statusInfo.state === 'thinking' ? `0 0 6px ${statusInfo.dotColor}` : undefined,
              }}
            />
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Message History Area */}
      <div className="ai-chat-messages">
        {messages.map((msg) => (
          <RiderAIErrorBoundary
            key={msg.id}
            fallbackTitle="Message Display Advisory"
            fallbackMessage="An advisory notice could not be displayed due to a format issue. The rest of your ride conversation remains active."
          >
            <AIMessage
              message={msg}
              onViewMap={onViewMap}
              onFindSaferRoute={onFindSaferRoute}
            />
          </RiderAIErrorBoundary>
        ))}

        {isThinking && <AIThinkingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Chips */}
      <AIQuickActions onSelectAction={onSendMessage} disabled={isThinking || isRateLimited} />

      {/* Message Input & Voice Composer */}
      <AIMessageComposer
        onSendMessage={onSendMessage}
        disabled={isThinking || isRateLimited}
        placeholder={composerPlaceholder}
      />
    </div>
  );
};

