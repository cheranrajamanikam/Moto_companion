import React from 'react';
import { ChatMessage, ChatUser } from '../types';
import { Trash2Icon, FlagIcon } from './icons';

interface Props {
  message: ChatMessage;
  currentUser: ChatUser;
  onDelete: (messageId: string) => void;
  onOpenReport: (messageId: string) => void;
  onOpenRiderProfile?: (userId: string) => void;
}

export const ChatMessageItem: React.FC<Props> = ({
  message,
  currentUser,
  onDelete,
  onOpenReport,
  onOpenRiderProfile,
}) => {
  const isOwn = message.senderId === currentUser.id;

  // Safe time formatting
  const timeFormatted = (() => {
    try {
      const d = new Date(message.createdAt);
      return isNaN(d.getTime())
        ? ''
        : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  })();

  // Compute initials (e.g. "Arjun Kumar" -> "AK")
  const initials = (message.senderName || 'Rider')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join('');

  const handleProfileClick = () => {
    if (onOpenRiderProfile) {
      onOpenRiderProfile(message.senderId);
    }
  };

  return (
    <div className={`chat-message-row ${isOwn ? 'own' : 'other'}`}>
      <div
        className={`chat-avatar ${isOwn ? 'own' : ''} ${onOpenRiderProfile ? 'clickable' : ''}`}
        title={onOpenRiderProfile ? `View ${message.senderName}'s public rider profile` : message.senderName}
        onClick={handleProfileClick}
        role={onOpenRiderProfile ? 'button' : undefined}
        tabIndex={onOpenRiderProfile ? 0 : undefined}
        onKeyDown={(e) => {
          if (onOpenRiderProfile && (e.key === 'Enter' || e.key === ' ')) {
            handleProfileClick();
          }
        }}
      >
        {initials}
      </div>

      <div className="chat-message-card">
        <div className="chat-message-header">
          <div className="chat-sender-info">
            <span
              className={`chat-sender-name ${onOpenRiderProfile ? 'clickable' : ''}`}
              title={onOpenRiderProfile ? `View ${message.senderName}'s public rider profile` : undefined}
              onClick={handleProfileClick}
              role={onOpenRiderProfile ? 'button' : undefined}
              tabIndex={onOpenRiderProfile ? 0 : undefined}
              onKeyDown={(e) => {
                if (onOpenRiderProfile && (e.key === 'Enter' || e.key === ' ')) {
                  handleProfileClick();
                }
              }}
            >
              {message.senderName}
            </span>
            {message.senderBike && (
              <span className="chat-bike-badge">{message.senderBike}</span>
            )}
          </div>
          {timeFormatted && <span className="chat-timestamp">{timeFormatted}</span>}
        </div>

        <div className={`chat-message-body ${message.isDeleted ? 'deleted' : ''}`}>
          {message.content}
        </div>

        {!message.isDeleted && (
          <div className="chat-message-actions">
            {isOwn ? (
              <button
                type="button"
                onClick={() => onDelete(message.id)}
                className="chat-action-btn delete"
                title="Delete your message for all riders"
              >
                <Trash2Icon size={12} style={{ marginRight: 3, verticalAlign: -1 }} />
                Delete
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenReport(message.id)}
                className="chat-action-btn report"
                title="Report inappropriate message to community safety"
              >
                <FlagIcon size={12} style={{ marginRight: 3, verticalAlign: -1 }} />
                Report
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
