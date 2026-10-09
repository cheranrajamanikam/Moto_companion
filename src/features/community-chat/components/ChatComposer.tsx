import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './icons';

interface Props {
  onSendMessage: (content: string) => Promise<any>;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

export const ChatComposer: React.FC<Props> = ({
  onSendMessage,
  onTyping,
  disabled = false,
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmed = content.trim();
  const isValid = trimmed.length > 0 && trimmed.length <= 1000 && !disabled && !isSubmitting;
  const isNearLimit = content.length > 900;

  // Auto-resize textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= 1000) {
      setContent(val);
      onTyping(val.trim().length > 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const result = await onSendMessage(trimmed);
      if (result) {
        setContent('');
        onTyping(false);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.focus();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="chat-composer-container">
      <div className="chat-composer-form">
        <div className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Share highway condition, hazard alert, or pitstop..."
            rows={1}
            disabled={disabled || isSubmitting}
            className="chat-textarea"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid}
          className="chat-send-btn"
          title="Send message (Enter)"
        >
          <span>Send</span>
          <SendIcon size={14} />
        </button>
      </div>

      <div className="chat-composer-footer">
        <span>
          Press <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 4px', borderRadius: 3, color: '#fff' }}>Enter</kbd> to send, <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 4px', borderRadius: 3, color: '#fff' }}>Shift + Enter</kbd> for newline
        </span>
        <span className={`chat-char-counter ${isNearLimit ? 'near-limit' : ''}`}>
          {content.length} / 1000
        </span>
      </div>
    </div>
  );
};
