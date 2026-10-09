import React from 'react';
import { SparklesIcon } from './icons';

export const AIThinkingIndicator: React.FC = () => {
  return (
    <div className="ai-thinking-row" aria-live="polite">
      <SparklesIcon size={14} style={{ color: 'var(--moto-orange)' }} />
      <span>Rider AI analyzing route data</span>
      <div className="thinking-dots">
        <span className="thinking-dot" />
        <span className="thinking-dot" />
        <span className="thinking-dot" />
      </div>
    </div>
  );
};
