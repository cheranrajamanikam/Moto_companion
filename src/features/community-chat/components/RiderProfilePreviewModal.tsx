import React from 'react';
import { ChatUser } from '../types';
import { UserIcon, XIcon, ShieldIcon } from './icons';

interface Props {
  rider: Partial<ChatUser> & { id: string; name: string };
  onClose: () => void;
  onOpenFullProfile?: (userId: string) => void;
}

export const RiderProfilePreviewModal: React.FC<Props> = ({
  rider,
  onClose,
  onOpenFullProfile,
}) => {
  const initials = (rider.name || 'Rider')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div
        className="chat-modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 460 }}
      >
        {/* Modal Header */}
        <div className="chat-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--moto-orange, #f97316)' }}>
            <UserIcon size={18} />
            <h3 className="chat-modal-title">Public Rider Profile</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="chat-modal-close"
            title="Close profile preview"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Rider Public Summary Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--moto-border-subtle, rgba(255, 255, 255, 0.08))',
            borderRadius: 'var(--moto-radius-md, 8px)',
            marginBottom: 16,
          }}
        >
          <div
            className="chat-avatar"
            style={{
              width: 52,
              height: 52,
              fontSize: '1.2rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #1f2937, #111827)',
              border: '2px solid var(--moto-orange, #f97316)',
              boxShadow: '0 0 12px rgba(255, 107, 0, 0.2)',
            }}
          >
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h4
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontFamily: "var(--moto-font-display, 'Chakra Petch', sans-serif)",
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {rider.name}
              </h4>

              {rider.role === 'moderator' && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    background: 'rgba(255, 107, 0, 0.15)',
                    border: '1px solid rgba(255, 107, 0, 0.4)',
                    color: 'var(--moto-orange, #f97316)',
                    padding: '1px 6px',
                    borderRadius: 4,
                    fontWeight: 700,
                  }}
                >
                  MODERATOR
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              {rider.bike && (
                <span className="chat-bike-badge">
                  🏍️ {rider.bike}
                </span>
              )}

              {rider.experienceLevel && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--moto-text-secondary, #9ca3af)',
                    textTransform: 'capitalize',
                  }}
                >
                  • {rider.experienceLevel} Rider
                </span>
              )}
            </div>

            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--moto-text-muted, #6b7280)',
                marginTop: 6,
                fontFamily: 'monospace',
              }}
            >
              ID: {rider.id}
            </div>
          </div>
        </div>

        {/* Member 2 Integration Specification Notice */}
        <div
          style={{
            background: 'rgba(255, 107, 0, 0.06)',
            border: '1px solid rgba(255, 107, 0, 0.2)',
            borderRadius: 'var(--moto-radius-md, 8px)',
            padding: '12px 14px',
            marginBottom: 14,
            fontSize: '0.78rem',
            lineHeight: 1.5,
            color: 'var(--moto-text-secondary, #9ca3af)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--moto-orange, #f97316)',
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            <ShieldIcon size={14} />
            <span>Member 2 Rider Profile Integration Point</span>
          </div>
          <p style={{ margin: 0 }}>
            Member 2 owns the complete Rider Profile system. In production, this trigger connects via{' '}
            <code style={{ color: '#fff' }}>onOpenRiderProfile(userId)</code> to display verified KYC status,
            community reputation, badges, and public ride history.
          </p>
        </div>

        {/* Privacy Boundary Guarantee */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--moto-border-subtle, rgba(255, 255, 255, 0.06))',
            borderRadius: 'var(--moto-radius-md, 8px)',
            padding: '10px 14px',
            marginBottom: 20,
            fontSize: '0.74rem',
            color: 'var(--moto-text-muted, #6b7280)',
            lineHeight: 1.45,
          }}
        >
          <strong style={{ color: '#fff' }}>🔒 Strict Privacy Boundary:</strong> Private credentials (Aadhaar, PAN,
          driving licence number, private phone, private email) are strictly excluded from Community Chat and will never
          be exposed over public channels.
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--moto-border-subtle, rgba(255, 255, 255, 0.12))',
              color: '#fff',
              borderRadius: 'var(--moto-radius-sm, 6px)',
              padding: '8px 16px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close Preview
          </button>

          {onOpenFullProfile && (
            <button
              type="button"
              onClick={() => {
                onOpenFullProfile(rider.id);
                onClose();
              }}
              style={{
                background: 'var(--moto-orange, #f97316)',
                border: 'none',
                color: '#fff',
                borderRadius: 'var(--moto-radius-sm, 6px)',
                padding: '8px 16px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Open Full Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
