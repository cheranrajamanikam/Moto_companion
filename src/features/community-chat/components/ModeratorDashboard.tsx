import React, { useState, useEffect, useCallback } from 'react';
import {
  ApplyModerationParams,
  ChatReport,
  ChatUser,
  ModerationAction,
  ModerationActionType,
} from '../types';
import { IChatAdapter } from '../adapters/chat-adapter.interface';
import { getChatAdapter } from '../adapters/chat-adapter.factory';
import { DEMO_PERSONAS } from '../constants/demo-personas';
import { RiderPersonaSwitcher } from './RiderPersonaSwitcher';
import { MotoLogoIcon, ArrowLeftIcon, ShieldIcon, CheckIcon, XIcon, BanIcon } from './icons';
import '../styles/community-chat.css';

interface Props {
  currentUser: ChatUser;
  onNavigateBack: () => void;
  onSelectPersona?: (persona: ChatUser) => void;
  adapter?: IChatAdapter;
}

export const ModeratorDashboard: React.FC<Props> = ({
  currentUser,
  onNavigateBack,
  onSelectPersona,
  adapter,
}) => {
  const chatAdapter = adapter || getChatAdapter();
  const [reports, setReports] = useState<ChatReport[]>([]);
  const [actions, setActions] = useState<ModerationAction[]>([]);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'reviewed' | 'dismissed' | 'all'>('pending');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Review Dialog State
  const [selectedReport, setSelectedReport] = useState<ChatReport | null>(null);
  const [actionType, setActionType] = useState<ModerationActionType>('warn');
  const [actionReason, setActionReason] = useState<string>('');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [durationSeconds, setDurationSeconds] = useState<number>(300); // 5 mins default
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const isModerator = currentUser.role === 'moderator' || currentUser.role === 'admin';

  const loadModerationData = useCallback(async () => {
    if (!isModerator) return;
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedReports, fetchedActions] = await Promise.all([
        chatAdapter.fetchReports(),
        chatAdapter.fetchModerationActions(),
      ]);
      setReports(fetchedReports);
      setActions(fetchedActions);
    } catch (err: any) {
      setError(err?.message || 'Failed to load moderation records.');
    } finally {
      setIsLoading(false);
    }
  }, [chatAdapter, isModerator]);

  useEffect(() => {
    loadModerationData();
  }, [loadModerationData]);

  const handleOpenActionModal = (report: ChatReport, defaultAction: ModerationActionType) => {
    setSelectedReport(report);
    setActionType(defaultAction);
    setActionReason(`Report review decision: ${report.reason}`);
    setActionNotes('');
    if (defaultAction === 'mute') setDurationSeconds(300); // 5 min
    else if (defaultAction === 'suspend') setDurationSeconds(3600); // 1 hr
    else setDurationSeconds(0);
  };

  const handleQuickDismiss = async (report: ChatReport) => {
    try {
      await chatAdapter.applyModerationAction({
        moderatorId: currentUser.id,
        targetUserId: report.reporterId, // or report sender
        actionType: 'dismiss',
        reason: 'Report reviewed and dismissed as non-violating.',
        reportId: report.id,
      });
      setActionSuccessMsg(`Report ${report.id.substring(0, 8)} dismissed.`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
      loadModerationData();
    } catch (err: any) {
      setError(err?.message || 'Failed to dismiss report.');
    }
  };

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const params: ApplyModerationParams = {
        moderatorId: currentUser.id,
        targetUserId: selectedReport.reporterId, // placeholder for target or message author
        actionType,
        reason: actionReason.trim() || `Moderator action applied for: ${selectedReport.reason}`,
        notes: actionNotes.trim() || undefined,
        durationSeconds: (actionType === 'mute' || actionType === 'suspend') ? durationSeconds : undefined,
        reportId: selectedReport.id,
      };

      await chatAdapter.applyModerationAction(params);
      setActionSuccessMsg(`Action "${actionType.toUpperCase()}" applied successfully.`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
      setSelectedReport(null);
      loadModerationData();
    } catch (err: any) {
      setError(err?.message || 'Failed to execute moderation decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const pendingCount = reports.filter((r) => r.status === 'pending').length;
  const reviewedCount = reports.filter((r) => r.status === 'reviewed').length;
  const dismissedCount = reports.filter((r) => r.status === 'dismissed').length;

  return (
    <div className="community-chat-scope">
      {/* Dev Persona Switcher */}
      {onSelectPersona && (
        <RiderPersonaSwitcher
          activePersona={currentUser}
          onSelectPersona={onSelectPersona}
        />
      )}

      {/* Prominent DEV / DEMO Pre-Auth Banner */}
      <div
        style={{
          background: 'rgba(234, 179, 8, 0.12)',
          borderBottom: '1px solid rgba(234, 179, 8, 0.35)',
          padding: '8px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          color: '#fef08a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              background: '#eab308',
              color: '#000',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: '0.68rem',
              letterSpacing: '0.06em',
            }}
          >
            DEV / DEMO MODE
          </span>
          <span>
            <strong>Pre-Auth Moderation Console:</strong> Injected persona identities are for development and testing. Production authorization will be bound to verified Supabase Auth JWT custom claims by Member 1.
          </span>
        </div>
        <button
          type="button"
          onClick={onNavigateBack}
          style={{
            background: 'transparent',
            border: '1px solid rgba(234, 179, 8, 0.4)',
            color: '#fef08a',
            padding: '4px 12px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: '0.74rem',
            fontWeight: 600,
          }}
        >
          Return to Chat
        </button>
      </div>

      {/* Top Navbar */}
      <nav className="moto-navbar">
        <div className="moto-nav-left">
          <div className="moto-logo-box">
            <MotoLogoIcon size={22} />
          </div>
          <span className="moto-logo-text">
            Moto<span>Companion</span> <span style={{ color: 'var(--moto-orange)', fontSize: '0.78rem', marginLeft: 6 }}>MODERATION</span>
          </span>
        </div>

        <div className="moto-nav-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--moto-border-subtle)',
              padding: '4px 12px',
              borderRadius: 9999,
            }}
          >
            <ShieldIcon size={16} color="var(--moto-orange)" />
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fff' }}>
              {currentUser.name}
            </span>
            <span
              style={{
                fontSize: '0.64rem',
                background: isModerator ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: isModerator ? 'var(--moto-green)' : '#fca5a5',
                padding: '1px 6px',
                borderRadius: 4,
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              {currentUser.role || 'rider'}
            </span>
          </div>

          <button
            type="button"
            onClick={onNavigateBack}
            className="chat-action-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', color: '#fff' }}
          >
            <ArrowLeftIcon size={14} />
            <span>Community Chat</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '24px 32px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        {!isModerator ? (
          /* Access Restricted View for Normal Riders */
          <div
            style={{
              background: 'var(--moto-card-bg, #121217)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 8,
              padding: 40,
              textAlign: 'center',
              marginTop: 40,
            }}
          >
            <div style={{ display: 'inline-flex', padding: 14, background: 'rgba(239, 68, 68, 0.12)', borderRadius: '50%', marginBottom: 16 }}>
              <BanIcon size={36} color="#ef4444" />
            </div>
            <h2 style={{ fontFamily: 'var(--moto-font-display)', color: '#fff', margin: '0 0 10px', fontSize: '1.4rem' }}>
              Access Restricted
            </h2>
            <p style={{ color: 'var(--moto-text-secondary)', maxWidth: 520, margin: '0 auto 24px', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Only demo personas with the <strong>moderator</strong> role (e.g., <strong>Vikram Rathore</strong>) can access this DEV / DEMO moderation console. Normal rider personas (Arjun, Priya) do not have moderation review permissions.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={onNavigateBack}
                style={{
                  background: 'var(--moto-orange)',
                  color: '#000',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 22px',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                }}
              >
                Return to Community Chat
              </button>
              {onSelectPersona && (
                <button
                  type="button"
                  onClick={() => onSelectPersona(DEMO_PERSONAS[2])}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    border: '1px solid var(--moto-border-subtle)',
                    borderRadius: 6,
                    padding: '10px 22px',
                    fontWeight: 600,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                  }}
                >
                  Switch to Vikram (Demo Mod)
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Authorized Moderator View */
          <div>
            {/* Action Feedback Banner */}
            {actionSuccessMsg && (
              <div
                style={{
                  background: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  padding: '10px 16px',
                  borderRadius: 6,
                  color: 'var(--moto-green)',
                  fontSize: '0.84rem',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CheckIcon size={16} />
                <span>{actionSuccessMsg}</span>
              </div>
            )}

            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '10px 16px',
                  borderRadius: 6,
                  color: '#fca5a5',
                  fontSize: '0.84rem',
                  marginBottom: 16,
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {/* Metrics Counters */}
            <section
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  background: 'var(--moto-card-bg, #121217)',
                  border: '1px solid var(--moto-border-subtle)',
                  borderRadius: 8,
                  padding: '16px 20px',
                }}
              >
                <div style={{ fontSize: '0.74rem', color: 'var(--moto-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Pending Reports
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--moto-orange)', fontFamily: 'var(--moto-font-display)', marginTop: 4 }}>
                  {pendingCount}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--moto-card-bg, #121217)',
                  border: '1px solid var(--moto-border-subtle)',
                  borderRadius: 8,
                  padding: '16px 20px',
                }}
              >
                <div style={{ fontSize: '0.74rem', color: 'var(--moto-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Reviewed Cases
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--moto-green)', fontFamily: 'var(--moto-font-display)', marginTop: 4 }}>
                  {reviewedCount}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--moto-card-bg, #121217)',
                  border: '1px solid var(--moto-border-subtle)',
                  borderRadius: 8,
                  padding: '16px 20px',
                }}
              >
                <div style={{ fontSize: '0.74rem', color: 'var(--moto-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Dismissed Reports
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--moto-text-muted)', fontFamily: 'var(--moto-font-display)', marginTop: 4 }}>
                  {dismissedCount}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--moto-card-bg, #121217)',
                  border: '1px solid var(--moto-border-subtle)',
                  borderRadius: 8,
                  padding: '16px 20px',
                }}
              >
                <div style={{ fontSize: '0.74rem', color: 'var(--moto-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Total Moderation Actions
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--moto-font-display)', marginTop: 4 }}>
                  {actions.length}
                </div>
              </div>
            </section>

            {/* Reports Review Queue */}
            <section
              style={{
                background: 'var(--moto-card-bg, #121217)',
                border: '1px solid var(--moto-border-subtle)',
                borderRadius: 8,
                padding: '20px 24px',
                marginBottom: 28,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'var(--moto-font-display)', fontSize: '1.15rem', color: '#fff' }}>
                    Community Reports Queue
                  </h3>
                  <div style={{ fontSize: '0.76rem', color: 'var(--moto-text-secondary)', marginTop: 2 }}>
                    Safety reviews submitted by corridor riders. Reports remain pending until explicit moderator action.
                  </div>
                </div>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: 6, background: 'rgba(255, 255, 255, 0.04)', padding: 3, borderRadius: 6 }}>
                  {(['pending', 'reviewed', 'dismissed', 'all'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setFilterStatus(tab)}
                      style={{
                        background: filterStatus === tab ? 'var(--moto-orange)' : 'transparent',
                        color: filterStatus === tab ? '#000' : 'var(--moto-text-secondary)',
                        border: 'none',
                        borderRadius: 4,
                        padding: '4px 10px',
                        fontSize: '0.74rem',
                        fontWeight: filterStatus === tab ? 700 : 500,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--moto-text-muted)', fontSize: '0.84rem' }}>
                  Loading community reports...
                </div>
              ) : filteredReports.length === 0 ? (
                <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--moto-text-muted)', fontSize: '0.84rem' }}>
                  No reports found in <strong>{filterStatus}</strong> state.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--moto-border-subtle)', color: 'var(--moto-text-secondary)', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '10px 12px' }}>Report ID</th>
                        <th style={{ padding: '10px 12px' }}>Reason</th>
                        <th style={{ padding: '10px 12px' }}>Details</th>
                        <th style={{ padding: '10px 12px' }}>Reporter</th>
                        <th style={{ padding: '10px 12px' }}>Status</th>
                        <th style={{ padding: '10px 12px' }}>Date</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.map((rep) => (
                        <tr key={rep.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '12px', fontFamily: 'monospace', color: 'var(--moto-text-secondary)', fontSize: '0.76rem' }}>
                            {rep.id.substring(0, 8)}...
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span
                              style={{
                                background: 'rgba(249, 115, 22, 0.12)',
                                color: 'var(--moto-orange)',
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontWeight: 600,
                                fontSize: '0.74rem',
                              }}
                            >
                              {rep.reason}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#fff', maxWidth: 280 }}>
                            {rep.details || <span style={{ color: 'var(--moto-text-muted)', fontStyle: 'italic' }}>No additional details</span>}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--moto-text-secondary)', fontSize: '0.76rem' }}>
                            {rep.reporterId}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span
                              style={{
                                color:
                                  rep.status === 'pending'
                                    ? '#eab308'
                                    : rep.status === 'reviewed'
                                    ? 'var(--moto-green)'
                                    : 'var(--moto-text-muted)',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                fontSize: '0.72rem',
                              }}
                            >
                              ● {rep.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: 'var(--moto-text-muted)', fontSize: '0.74rem' }}>
                            {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            {rep.status === 'pending' ? (
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => handleQuickDismiss(rep)}
                                  title="Dismiss non-violating report"
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--moto-border-subtle)',
                                    color: 'var(--moto-text-secondary)',
                                    padding: '4px 8px',
                                    borderRadius: 4,
                                    fontSize: '0.72rem',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Dismiss
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenActionModal(rep, 'warn')}
                                  title="Issue official rider warning"
                                  style={{
                                    background: 'rgba(234, 179, 8, 0.12)',
                                    border: '1px solid rgba(234, 179, 8, 0.3)',
                                    color: '#fef08a',
                                    padding: '4px 8px',
                                    borderRadius: 4,
                                    fontSize: '0.72rem',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Warn
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenActionModal(rep, 'mute')}
                                  title="Apply temporary mute"
                                  style={{
                                    background: 'rgba(249, 115, 22, 0.15)',
                                    border: '1px solid rgba(249, 115, 22, 0.3)',
                                    color: 'var(--moto-orange)',
                                    padding: '4px 8px',
                                    borderRadius: 4,
                                    fontSize: '0.72rem',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                  }}
                                >
                                  Mute
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenActionModal(rep, 'suspend')}
                                  title="Temporary corridor suspension"
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#fca5a5',
                                    padding: '4px 8px',
                                    borderRadius: 4,
                                    fontSize: '0.72rem',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                  }}
                                >
                                  Suspend
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.74rem', color: 'var(--moto-text-muted)' }}>
                                Action Taken
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Moderation Actions Audit Trail */}
            <section
              style={{
                background: 'var(--moto-card-bg, #121217)',
                border: '1px solid var(--moto-border-subtle)',
                borderRadius: 8,
                padding: '20px 24px',
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontFamily: 'var(--moto-font-display)', fontSize: '1.15rem', color: '#fff' }}>
                Moderation Action Audit Log
              </h3>

              {actions.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--moto-text-muted)', fontSize: '0.84rem' }}>
                  No moderation actions recorded yet.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--moto-border-subtle)', color: 'var(--moto-text-secondary)', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '8px 12px' }}>Action Type</th>
                        <th style={{ padding: '8px 12px' }}>Target Rider ID</th>
                        <th style={{ padding: '8px 12px' }}>Reason</th>
                        <th style={{ padding: '8px 12px' }}>Moderator</th>
                        <th style={{ padding: '8px 12px' }}>Expires At</th>
                        <th style={{ padding: '8px 12px' }}>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actions.map((act) => (
                        <tr key={act.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                background:
                                  act.actionType === 'ban'
                                    ? 'rgba(239, 68, 68, 0.2)'
                                    : act.actionType === 'suspend'
                                    ? 'rgba(239, 68, 68, 0.12)'
                                    : act.actionType === 'mute'
                                    ? 'rgba(249, 115, 22, 0.15)'
                                    : act.actionType === 'warn'
                                    ? 'rgba(234, 179, 8, 0.15)'
                                    : 'rgba(255, 255, 255, 0.05)',
                                color:
                                  act.actionType === 'ban' || act.actionType === 'suspend'
                                    ? '#fca5a5'
                                    : act.actionType === 'mute'
                                    ? 'var(--moto-orange)'
                                    : act.actionType === 'warn'
                                    ? '#fef08a'
                                    : 'var(--moto-text-secondary)',
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontWeight: 700,
                                fontSize: '0.72rem',
                                textTransform: 'uppercase',
                              }}
                            >
                              {act.actionType}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#fff' }}>
                            {act.targetUserId}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--moto-text-secondary)' }}>
                            {act.reason}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--moto-text-muted)', fontSize: '0.74rem' }}>
                            {act.moderatorId}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--moto-text-muted)', fontSize: '0.74rem' }}>
                            {act.expiresAt ? new Date(act.expiresAt).toLocaleTimeString() : 'Permanent / N/A'}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--moto-text-muted)', fontSize: '0.74rem' }}>
                            {new Date(act.createdAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Action Dialog Modal */}
      {selectedReport && (
        <div className="chat-modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="chat-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="chat-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--moto-orange)' }}>
                <ShieldIcon size={18} />
                <h3 className="chat-modal-title">Apply Moderation Decision</h3>
              </div>
              <button type="button" onClick={() => setSelectedReport(null)} className="chat-modal-close">
                <XIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleExecuteAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--moto-text-muted)', marginBottom: 6 }}>
                  Action Type:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                  {(['dismiss', 'warn', 'mute', 'suspend', 'ban'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setActionType(t)}
                      style={{
                        background: actionType === t ? 'var(--moto-orange)' : 'rgba(255, 255, 255, 0.05)',
                        color: actionType === t ? '#000' : '#fff',
                        border: '1px solid var(--moto-border-subtle)',
                        padding: '6px 4px',
                        borderRadius: 4,
                        fontSize: '0.74rem',
                        fontWeight: actionType === t ? 700 : 500,
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {(actionType === 'mute' || actionType === 'suspend') && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--moto-text-muted)', marginBottom: 6 }}>
                    Restriction Duration:
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { label: '5 Minutes (Test)', seconds: 300 },
                      { label: '1 Hour', seconds: 3600 },
                      { label: '24 Hours', seconds: 86400 },
                    ].map((d) => (
                      <button
                        key={d.seconds}
                        type="button"
                        onClick={() => setDurationSeconds(d.seconds)}
                        style={{
                          background: durationSeconds === d.seconds ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: durationSeconds === d.seconds ? '1px solid var(--moto-orange)' : '1px solid var(--moto-border-subtle)',
                          color: durationSeconds === d.seconds ? 'var(--moto-orange)' : 'var(--moto-text-secondary)',
                          borderRadius: 4,
                          padding: '6px 12px',
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                          fontWeight: durationSeconds === d.seconds ? 700 : 400,
                        }}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--moto-text-muted)', marginBottom: 4 }}>
                  Official Reason:
                </label>
                <input
                  type="text"
                  required
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="e.g., Unsafe route advice / Spam transmission"
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--moto-border-subtle)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.82rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--moto-text-muted)', marginBottom: 4 }}>
                  Internal Moderator Notes (Optional):
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Additional context for audit log..."
                  rows={2}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--moto-border-subtle)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.82rem',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="chat-modal-btn secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="chat-modal-btn primary"
                  style={{ minWidth: 120 }}
                >
                  {isSubmitting ? 'Applying...' : `Execute ${actionType.toUpperCase()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
