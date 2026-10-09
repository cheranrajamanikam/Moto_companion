import React from 'react';
import { RecentDestinationItem } from '../services/navigation-storage.service';

interface Props {
  recentItems: RecentDestinationItem[];
  onSelectDestination: (item: RecentDestinationItem) => void;
  onClearHistory?: () => void;
}

export const RecentDestinationsCard: React.FC<Props> = ({
  recentItems,
  onSelectDestination,
  onClearHistory,
}) => {
  if (!recentItems || recentItems.length === 0) {
    return null;
  }

  return (
    <div className="recent-destinations-card" data-testid="recent-destinations-card">
      <div className="recent-destinations-header">
        <div className="recent-title-group">
          <span className="recent-history-icon">🕒</span>
          <span className="recent-title">Recent Destinations</span>
        </div>
        {onClearHistory && (
          <button
            type="button"
            className="recent-clear-btn"
            onClick={onClearHistory}
            title="Clear recent searches"
            data-testid="clear-recent-history-btn"
          >
            Clear
          </button>
        )}
      </div>

      <div className="recent-items-list" data-testid="recent-items-list">
        {recentItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className="recent-item-row"
            onClick={() => onSelectDestination(item)}
            data-testid={`recent-item-${item.id}`}
          >
            <div className="recent-pin-circle">📍</div>
            <div className="recent-text-group">
              <span className="recent-item-name">{item.name}</span>
              <span className="recent-item-address">{item.displayName || item.name}</span>
            </div>
            <span className="recent-select-arrow">➔</span>
          </button>
        ))}
      </div>
    </div>
  );
};
