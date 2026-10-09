import React, { useState } from 'react';
import { ChatUser } from '../types';
import { DEMO_PERSONAS, DEFAULT_GLOBAL_ROOM } from '../constants/demo-personas';
import { RiderPersonaSwitcher } from './RiderPersonaSwitcher';
import { CommunityChat } from './CommunityChat';
import { MotoLogoIcon, ArrowLeftIcon } from './icons';
import '../styles/community-chat.css';

interface Props {
  onNavigateToCockpit: () => void;
  onNavigateToModeration?: () => void;
  /**
   * Optional: Authenticated rider provided by Member 1's login system.
   * When supplied, the chat uses this real identity and hides the DEV / DEMO persona switcher.
   */
  currentUser?: ChatUser;
  initialPersona?: ChatUser;
  /**
   * Optional integration callback to navigate or open Member 2's Rider Profile system.
   * Signature: (userId: string) => void
   */
  onOpenRiderProfile?: (userId: string) => void;
}

export const CommunityChatPage: React.FC<Props> = ({
  onNavigateToCockpit,
  onNavigateToModeration,
  currentUser,
  initialPersona = DEMO_PERSONAS[0],
  onOpenRiderProfile,
}) => {
  const [activePersona, setActivePersona] = useState<ChatUser>(currentUser || initialPersona);

  React.useEffect(() => {
    if (currentUser) {
      setActivePersona(currentUser);
    }
  }, [currentUser]);

  return (
    <div className="community-chat-scope">
      {/* Dev / Demo Mode Persona Switcher: Only displayed in DEV mode when no real production currentUser is injected */}
      {!currentUser && (
        <RiderPersonaSwitcher
          activePersona={activePersona}
          onSelectPersona={setActivePersona}
        />
      )}

      {/* Top Navbar matching MotoCompanion Reference */}
      <nav className="moto-navbar">
        <div className="moto-nav-left">
          <div className="moto-logo-box">
            <MotoLogoIcon size={22} />
          </div>
          <a
            href="#intelligence"
            onClick={(e) => {
              e.preventDefault();
              onNavigateToCockpit();
            }}
            className="moto-logo-text"
          >
            Moto<span>Companion</span>
          </a>
        </div>

        <ul className="moto-nav-links">
          <li>
            <a
              href="#intelligence"
              onClick={(e) => {
                e.preventDefault();
                onNavigateToCockpit();
              }}
              className="moto-nav-link"
            >
              Intelligence
            </a>
          </li>
          <li>
            <a href="#community" className="moto-nav-link active">
              Community
            </a>
          </li>
          <li>
            <a href="#safety" className="moto-nav-link">
              Safety
            </a>
          </li>
          <li>
            <a href="#riders" className="moto-nav-link">
              Riders
            </a>
          </li>
        </ul>

        <div className="moto-nav-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Active Rider Identity Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--moto-border-subtle)',
              padding: '4px 10px',
              borderRadius: 'var(--moto-radius-full, 9999px)',
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'var(--moto-orange)',
                color: '#000',
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {activePersona.name[0]}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fff' }}>
                {activePersona.name}
              </span>
              <span style={{ fontSize: '0.64rem', color: 'var(--moto-text-secondary)' }}>
                {activePersona.bike}
              </span>
            </div>
          </div>

          {/* Dedicated Moderator Console Link (Visible only for Demo Moderator Persona) */}
          {activePersona.role === 'moderator' && onNavigateToModeration && (
            <button
              type="button"
              onClick={onNavigateToModeration}
              style={{
                background: 'rgba(234, 179, 8, 0.15)',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                borderRadius: 'var(--moto-radius-sm)',
                color: '#fef08a',
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '6px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>🛡️ Mod Console (Demo)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateToCockpit}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--moto-border-subtle)',
              borderRadius: 'var(--moto-radius-sm)',
              color: '#fff',
              fontSize: '0.78rem',
              fontWeight: 600,
              padding: '6px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ArrowLeftIcon size={14} />
            <span>Cockpit</span>
          </button>
        </div>
      </nav>

      {/* Main Realtime Chat Area */}
      <CommunityChat
        currentUser={activePersona}
        roomId={DEFAULT_GLOBAL_ROOM.id}
        roomName={DEFAULT_GLOBAL_ROOM.name}
        roomDescription={DEFAULT_GLOBAL_ROOM.description}
        onNavigateBack={onNavigateToCockpit}
        onOpenRiderProfile={onOpenRiderProfile}
      />
    </div>
  );
};
