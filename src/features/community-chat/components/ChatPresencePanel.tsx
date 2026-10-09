import React from 'react';
import { PresenceState, ChatUser } from '../types';
import { UsersIcon, XIcon } from './icons';

interface Props {
  presenceState: PresenceState;
  currentUser: ChatUser;
  currentSessionTabId: string;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenRiderProfile?: (userId: string) => void;
}

export const ChatPresencePanel: React.FC<Props> = ({
  presenceState,
  currentUser,
  currentSessionTabId,
  isOpenOnMobile = false,
  onCloseMobile,
  onOpenRiderProfile,
}) => {
  return (
    <aside className={`chat-presence-sidebar ${isOpenOnMobile ? 'open' : ''}`}>
      <div className="presence-sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UsersIcon size={16} style={{ color: 'var(--moto-orange)' }} />
          <h3 className="presence-sidebar-title">Riders Online</h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--moto-green, #10b981)',
              padding: '2px 8px',
              borderRadius: 'var(--moto-radius-full, 9999px)',
              fontSize: '0.74rem',
              fontWeight: 700,
            }}
          >
            {presenceState.onlineCount}
          </span>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="chat-action-btn"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <XIcon size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="presence-riders-list">
        {presenceState.riders.map((rider) => {
          const isCurrentSession = rider.sessionTabId === currentSessionTabId;
          const isCurrentUser = rider.user.id === currentUser.id;

          const initials = (rider.user.name || 'Rider')
            .split(' ')
            .filter(Boolean)
            .map((w) => w[0].toUpperCase())
            .slice(0, 2)
            .join('');

          return (
            <div
              key={rider.sessionTabId}
              className={`presence-rider-card ${isCurrentSession ? 'current' : ''} ${onOpenRiderProfile ? 'clickable' : ''}`}
              title={onOpenRiderProfile ? `View ${rider.user.name}'s public rider profile` : undefined}
              onClick={() => onOpenRiderProfile?.(rider.user.id)}
              role={onOpenRiderProfile ? 'button' : undefined}
              tabIndex={onOpenRiderProfile ? 0 : undefined}
              onKeyDown={(e) => {
                if (onOpenRiderProfile && (e.key === 'Enter' || e.key === ' ')) {
                  onOpenRiderProfile(rider.user.id);
                }
              }}
            >
              <div className="presence-rider-avatar">
                {initials}
                <span className="presence-status-pip" />
              </div>

              <div className="presence-rider-details">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="presence-rider-name">{rider.user.name}</span>
                  {isCurrentUser && (
                    <span
                      style={{
                        fontSize: '0.66rem',
                        color: 'var(--moto-orange, #f97316)',
                        fontWeight: 700,
                      }}
                    >
                      {isCurrentSession ? '(You)' : '(Other Tab)'}
                    </span>
                  )}
                </div>

                <div className="presence-rider-bike">
                  {rider.user.bike || 'Motorcycle'}
                </div>
              </div>
            </div>
          );
        })}

        {presenceState.riders.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--moto-text-muted)', fontSize: '0.8rem', padding: '20px 0' }}>
            Broadcasting rider presence...
          </div>
        )}
      </div>

      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--moto-border-subtle)',
          fontSize: '0.72rem',
          color: 'var(--moto-text-muted)',
          lineHeight: 1.4,
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        💡 <em>Riders in different browser tabs or devices appear here in real time.</em>
      </div>
    </aside>
  );
};
