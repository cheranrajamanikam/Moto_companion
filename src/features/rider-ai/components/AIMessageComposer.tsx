import React, { useState } from 'react';
import { SendIcon } from './icons';
import { VoiceInputButton } from './VoiceInputButton';

interface AIMessageComposerProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const AIMessageComposer: React.FC<AIMessageComposerProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Type your route or hazard question...',
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || disabled) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleVoiceTranscript = (text: string) => {
    setInputValue(text);
  };

  return (
    <form className="ai-composer-wrap" onSubmit={handleSubmit}>
      <input
        type="text"
        className="ai-composer-input"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={disabled}
      />

      <VoiceInputButton onTranscript={handleVoiceTranscript} disabled={disabled} />

      <button
        type="submit"
        className="ai-composer-btn send"
        disabled={disabled || !inputValue.trim()}
        title="Send inquiry to Rider AI co-pilot"
        aria-label="Send message"
      >
        <SendIcon size={18} />
      </button>
    </form>
  );
};
