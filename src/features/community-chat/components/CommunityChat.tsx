import React, { useState } from 'react';
import { ChatUser } from '../types';
import { IChatAdapter } from '../adapters/chat-adapter.interface';
import { useCommunityChat } from '../hooks/useCommunityChat';
import { DEFAULT_GLOBAL_ROOM } from '../constants/demo-personas';
import { ChatMessageList } from './ChatMessageList';
import { ChatComposer } from './ChatComposer';
import { ChatTypingIndicator } from './ChatTypingIndicator';
import { ChatPresencePanel } from './ChatPresencePanel';
import { ChatReportModal } from './ChatReportModal';
import { RiderProfilePreviewModal } from './RiderProfilePreviewModal';
import { MessageSquareIcon, UsersIcon, ArrowLeftIcon } from './icons';
import '../styles/community-chat.css';

export interface CommunityChatProps {
  currentUser: ChatUser;
  roomId?: string;
  roomName?: string;
  roomDescription?: string;
  onNavigateBack?: () => void;
  customAdapter?: IChatAdapter;
  /**
   * Integration callback for Member 2's Rider Profile system.
   * Invoked when a rider's avatar or handle is clicked.
   */
  onOpenRiderProfile?: (userId: string) => void;
}

export const CommunityChat: React.FC<CommunityChatProps> = ({
  currentUser,
  roomId = DEFAULT_GLOBAL_ROOM.id,
  roomName = DEFAULT_GLOBAL_ROOM.name,
  roomDescription = DEFAULT_GLOBAL_ROOM.description,
  onNavigateBack,
  customAdapter,
  onOpenRiderProfile,
}) => {
  const [reportingMsgId, setReportingMsgId] = useState<string | null>(null);
  const [isMobilePresenceOpen, setIsMobilePresenceOpen] = useState<boolean>(false);
  const [previewRider, setPreviewRider] = useState<(Partial<ChatUser> & { id: string; name: string }) | null>(null);

  const {
    messages,
    onlineCount,
    onlineRiders,
    typingUsers,
    isLoading,
    error,
    sessionTabId,
    sendMessage,
    deleteMessage,
    reportMessage,
    setTyping,
    clearError,
  } = useCommunityChat({
    currentUser,
    roomId,
    adapter: customAdapter,
  });

  const handleOpenRiderProfile = (userId: string) => {
    // If the parent shell provided an external handler (e.g. Member 2's profile routing), delegate to it
    if (onOpenRiderProfile) {
      onOpenRiderProfile(userId);
      return;
    }

    // DEV / DEMO fallback: resolve rider from messages, onlineRiders, or currentUser
    const foundOnline = onlineRiders.find((r) => r.user.id === userId)?.user;
    const foundMsg = messages.find((m) => m.senderId === userId);
    const resolvedFromMsg = foundMsg
      ? {
          id: foundMsg.senderId,
          name: foundMsg.senderName,
          bike: foundMsg.senderBike,
          avatarUrl: foundMsg.senderAvatarUrl,
        }
      : null;
    const isSelf = currentUser.id === userId ? currentUser : null;
    const resolvedRider = isSelf || foundOnline || resolvedFromMsg;

    if (resolvedRider) {
      setPreviewRider(resolvedRider);
    } else {
      // Fallback stub for unknown user id
      setPreviewRider({
        id: userId,
        name: 'Rider ' + userId.slice(0, 6),
        bike: 'Motorcycle',
        role: 'rider',
        avatarUrl: '',
        experienceLevel: 'intermediate',
      });
    }
  };

  const handleDelete = async (messageId: string) => {
    if (window.confirm('Delete this message for all riders?')) {
      await deleteMessage(messageId);
    }
  };

  return (
    <div className="chat-layout-container">
      {/* Main Chat Column */}
      <section className="chat-main-column">
        {/* Room Header */}
        <header className="chat-room-header">
          <div className="chat-room-title-box">
            {onNavigateBack && (
              <button
                type="button"
                onClick={onNavigateBack}
                className="chat-action-btn"
                title="Return to Cockpit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: 'var(--moto-text-secondary)',
                  marginRight: 4,
                }}
              >
                <ArrowLeftIcon size={16} />
              </button>
            )}

            <div className="chat-room-icon-box">
              <MessageSquareIcon size={18} />
            </div>

            <div>
              <h2 className="chat-room-name">{roomName}</h2>
              <div className="chat-room-desc">{roomDescription}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Presence Toggle Pill */}
            <button
              type="button"
              onClick={() => setIsMobilePresenceOpen((prev) => !prev)}
              className="chat-presence-pill-btn"
              title="View connected online riders"
            >
              <span className="presence-dot" />
              <span>{onlineCount} Online</span>
              <UsersIcon size={13} style={{ marginLeft: 2 }} />
            </button>
          </div>
        </header>

        {/* Inline Error Notice */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '8px 20px',
              fontSize: '0.8rem',
              color: '#fca5a5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>⚠️ {error}</span>
            <button
              type="button"
              onClick={clearError}
              style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Message Feed */}
        <ChatMessageList
          messages={messages}
          currentUser={currentUser}
          isLoading={isLoading}
          onDelete={handleDelete}
          onOpenReport={(id) => setReportingMsgId(id)}
          onOpenRiderProfile={handleOpenRiderProfile}
        />

        {/* Typing Bar */}
        <ChatTypingIndicator typingUsers={typingUsers} />

        {/* Message Composer */}
        <ChatComposer
          onSendMessage={sendMessage}
          onTyping={setTyping}
          disabled={isLoading}
        />
      </section>

      {/* Right Presence Sidebar Panel */}
      <ChatPresencePanel
        presenceState={{ onlineCount, riders: onlineRiders }}
        currentUser={currentUser}
        currentSessionTabId={sessionTabId}
        isOpenOnMobile={isMobilePresenceOpen}
        onCloseMobile={() => setIsMobilePresenceOpen(false)}
        onOpenRiderProfile={handleOpenRiderProfile}
      />

      {/* Reporting Modal */}
      {reportingMsgId && (
        <ChatReportModal
          messageId={reportingMsgId}
          onClose={() => setReportingMsgId(null)}
          onSubmitReport={reportMessage}
        />
      )}

      {/* Rider Public Profile Preview (DEV / DEMO Modal & Member 2 Integration Bridge) */}
      {previewRider && (
        <RiderProfilePreviewModal
          rider={previewRider}
          onClose={() => setPreviewRider(null)}
          onOpenFullProfile={onOpenRiderProfile}
        />
      )}
    </div>
  );
};
