import React, { useState } from 'react';
import { ReportReason } from '../types';
import { FlagIcon, XIcon, CheckIcon } from './icons';

interface Props {
  messageId: string;
  onClose: () => void;
  onSubmitReport: (messageId: string, reason: ReportReason, details?: string) => Promise<boolean>;
}

const REASONS: Array<{ value: ReportReason; label: string; desc: string }> = [
  { value: 'spam', label: 'Spam or Commercial Promotion', desc: 'Repetitive messages, advertisements, or irrelevant links.' },
  { value: 'false-hazard', label: 'False Hazard / Misleading Road Info', desc: 'Inaccurate hazard alert or dangerous riding route instruction.' },
  { value: 'harassment', label: 'Harassment or Hostile Behavior', desc: 'Aggressive comments or targeting another community member.' },
  { value: 'inappropriate', label: 'Inappropriate or Explicit Content', desc: 'Content violating MotoCompanion community safety guidelines.' },
  { value: 'other', label: 'Other Issue', desc: 'Any other safety or operational concern.' },
];

export const ChatReportModal: React.FC<Props> = ({
  messageId,
  onClose,
  onSubmitReport,
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason>('spam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const ok = await onSubmitReport(messageId, selectedReason, details.trim());
      if (ok) {
        setIsDone(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="chat-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--moto-orange)' }}>
            <FlagIcon size={18} />
            <h3 className="chat-modal-title">Report Message</h3>
          </div>

          <button type="button" onClick={onClose} className="chat-modal-close">
            <XIcon size={16} />
          </button>
        </div>

        {isDone ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--moto-green)' }}>
            <CheckIcon size={32} style={{ marginBottom: 8 }} />
            <h4 style={{ margin: '0 0 6px', fontFamily: 'var(--moto-font-display)', fontSize: '1.05rem', color: '#fff' }}>
              Report Received
            </h4>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--moto-text-secondary)' }}>
              Thank you for keeping MotoCompanion corridors safe for all riders.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--moto-text-secondary)' }}>
              Select why this corridor broadcast should be reviewed:
            </p>

            <div className="chat-report-options">
              {REASONS.map((r) => (
                <label key={r.value} className="chat-report-option-label">
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.value}
                    checked={selectedReason === r.value}
                    onChange={() => setSelectedReason(r.value)}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{r.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--moto-text-muted)' }}>{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--moto-text-muted)', marginBottom: 4 }}>
                Additional details (optional):
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe the issue..."
                rows={2}
                maxLength={300}
                style={{
                  width: '100%',
                  background: 'var(--moto-bg-input)',
                  border: '1px solid var(--moto-border-subtle)',
                  borderRadius: 'var(--moto-radius-sm)',
                  padding: '8px 10px',
                  color: '#fff',
                  fontSize: '0.8rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'none',
                }}
              />
            </div>

            <div className="chat-modal-actions">
              <button
                type="button"
                onClick={onClose}
                className="chat-modal-cancel"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="chat-modal-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
