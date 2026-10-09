import React from 'react';

export const QUICK_ACTIONS = [
  'Is my route safe?',
  'What hazards are ahead?',
  'Find a safer route',
  'Check weather',
  'Find fuel',
  'Find food',
  'Find a repair stop',
  'Is my bike suitable for this route?',
  'What should I carry?',
] as const;

interface AIQuickActionsProps {
  onSelectAction: (action: string) => void;
  disabled?: boolean;
}

export const AIQuickActions: React.FC<AIQuickActionsProps> = ({
  onSelectAction,
  disabled = false,
}) => {
  return (
    <div className="ai-quick-actions-wrap">
      <span className="ai-quick-actions-label">Rider Quick Actions</span>
      <div className="ai-quick-actions-list">
        {QUICK_ACTIONS.map((action, i) => (
          <button
            key={i}
            type="button"
            className="quick-action-btn"
            onClick={() => onSelectAction(action)}
            disabled={disabled}
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
};
