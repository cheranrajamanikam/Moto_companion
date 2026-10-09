import React, { useState, useRef, useEffect } from 'react';
import { useCommunityChat } from '../hooks/useCommunityChat';
import { DEMO_PERSONAS, DEFAULT_GLOBAL_ROOM } from '../constants/demo-personas';
import { ChatUser, ReportReason } from '../types';

interface Props {
  onExit?: () => void;
}

export const CommunityChatDevBench: React.FC<Props> = ({ onExit }) => {
  const [activePersona, setActivePersona] = useState<ChatUser>(DEMO_PERSONAS[0]);
  const [inputText, setInputText] = useState('');
  const [reportingMsgId, setReportingMsgId] = useState<string | null>(null);
  const [reportSuccessNotice, setReportSuccessNotice] = useState<string | null>(null);

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
    currentUser: activePersona,
    roomId: DEFAULT_GLOBAL_ROOM.id,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);
    if (text.trim().length > 0) {
      setTyping(true);
    } else {
      setTyping(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const sent = await sendMessage(inputText);
    if (sent) {
      setInputText('');
      setTyping(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this message for all riders?')) {
      await deleteMessage(id);
    }
  };

  const handleReport = async (msgId: string, reason: ReportReason) => {
    const success = await reportMessage(msgId, reason, 'Reported via dev test bench');
    if (success) {
      setReportingMsgId(null);
      setReportSuccessNotice(`Report submitted for message ${msgId.substring(0, 8)}... (${reason})`);
      setTimeout(() => setReportSuccessNotice(null), 4000);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0d',
        color: '#f4f4f7',
        fontFamily: 'var(--moto-font-body, "Inter Tight", sans-serif)',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: '820px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Top Control Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#121217',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '12px 18px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'var(--moto-font-display, "Chakra Petch")', fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>
                🏍️ Community Chat Phase 2 Test Bench
              </span>
              <span style={{ fontSize: '0.72rem', background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                Local Multi-Tab Sync
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>
              Tab Session: <code style={{ color: '#38bdf8' }}>{sessionTabId}</code>
            </div>
          </div>

          {onExit && (
            <button
              type="button"
              onClick={onExit}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              Back to Cockpit
            </button>
          )}
        </div>

        {/* Persona Switcher Bar (Dev Tooling) */}
        <div
          style={{
            background: 'rgba(24, 24, 32, 0.85)',
            border: '1px solid rgba(249, 115, 22, 0.25)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.76rem', color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Testing Tool: Active Persona Switcher
            </span>
            <span style={{ fontSize: '0.74rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              {onlineCount} {onlineCount === 1 ? 'Rider' : 'Riders'} Online
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DEMO_PERSONAS.map((p) => {
              const isSelected = p.id === activePersona.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePersona(p)}
                  style={{
                    background: isSelected ? '#f97316' : 'rgba(255, 255, 255, 0.04)',
                    color: isSelected ? '#000' : '#fff',
                    border: isSelected ? '1px solid #f97316' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: isSelected ? 700 : 500,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p.name} <span style={{ opacity: 0.8, fontSize: '0.74rem' }}>({p.bike})</span>
                </button>
              );
            })}
          </div>

          {onlineRiders.length > 0 && (
            <div style={{ fontSize: '0.74rem', color: '#9ca3af', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span>Live Tabs:</span>
              {onlineRiders.map((r) => (
                <span key={r.sessionTabId} style={{ color: '#fff', background: 'rgba(255, 255, 255, 0.06)', padding: '1px 6px', borderRadius: 4 }}>
                  {r.user.name} ({r.sessionTabId.substring(4, 9)})
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Notice/Error Banners */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '0.84rem',
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

        {reportSuccessNotice && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.82rem',
              color: '#6ee7b7',
            }}
          >
            ✓ {reportSuccessNotice}
          </div>
        )}

        {/* Room Header */}
        <div
          style={{
            background: '#121217',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px 10px 0 0',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--moto-font-display, "Chakra Petch")', fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
              {DEFAULT_GLOBAL_ROOM.name}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#9ca3af' }}>
              {DEFAULT_GLOBAL_ROOM.description}
            </div>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#f97316', fontWeight: 600 }}>
            Room: #{DEFAULT_GLOBAL_ROOM.id}
          </span>
        </div>

        {/* Message Feed Area */}
        <div
          style={{
            background: '#15151c',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderTop: 'none',
            height: '420px',
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {isLoading && messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0', fontSize: '0.88rem' }}>
              Connecting to local channel & fetching message history...
            </div>
          ) : (
            messages.map((m) => {
              const isOwn = m.senderId === activePersona.id;
              const timeStr = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: isOwn ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    background: isOwn ? 'rgba(249, 115, 22, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                    border: isOwn ? '1px solid rgba(249, 115, 22, 0.3)' : '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.84rem', color: isOwn ? '#f97316' : '#fff' }}>
                        {m.senderName}
                      </span>
                      {m.senderBike && (
                        <span style={{ fontSize: '0.72rem', color: '#9ca3af', background: 'rgba(255, 255, 255, 0.06)', padding: '1px 5px', borderRadius: 3 }}>
                          {m.senderBike}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{timeStr}</span>
                  </div>

                  <div
                    style={{
                      fontSize: '0.88rem',
                      lineHeight: 1.45,
                      color: m.isDeleted ? '#9ca3af' : '#f4f4f7',
                      fontStyle: m.isDeleted ? 'italic' : 'normal',
                    }}
                  >
                    {m.content}
                  </div>

                  {/* Actions for message */}
                  {!m.isDeleted && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 6, justifyContent: 'flex-end' }}>
                      {isOwn ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(m.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            padding: 0,
                            fontWeight: 600,
                          }}
                        >
                          Delete
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setReportingMsgId(m.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#9ca3af',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          Report
                        </button>
                      )}
                    </div>
                  )}

                  {/* Quick Report Menu if opened for this message */}
                  {reportingMsgId === m.id && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: '6px 10px',
                        background: 'rgba(0,0,0,0.4)',
                        borderRadius: 6,
                        display: 'flex',
                        gap: 6,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>Reason:</span>
                      {(['spam', 'harassment', 'inappropriate', 'false-hazard'] as ReportReason[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => handleReport(m.id, r)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#fff',
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: 4,
                            cursor: 'pointer',
                          }}
                        >
                          {r}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setReportingMsgId(null)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#9ca3af',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Typing Bar */}
        <div style={{ height: 22, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
          {typingUsers.length > 0 && (
            <span style={{ fontSize: '0.76rem', color: '#f97316', fontStyle: 'italic' }}>
              ✍️ {typingUsers.map((t) => t.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          )}
        </div>

        {/* Composer Input Bar */}
        <form
          onSubmit={handleSend}
          style={{
            display: 'flex',
            gap: 10,
            background: '#121217',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '0 0 10px 10px',
            padding: '12px 16px',
          }}
        >
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={`Message #global-riders as ${activePersona.name}...`}
              maxLength={1000}
              style={{
                width: '100%',
                background: '#15151c',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '6px',
                padding: '10px 14px',
                color: '#fff',
                fontSize: '0.88rem',
                fontFamily: 'var(--moto-font-body, "Inter Tight", sans-serif)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {inputText.length > 0 && (
              <span style={{ position: 'absolute', right: 12, top: 12, fontSize: '0.72rem', color: '#6b7280' }}>
                {inputText.length}/1000
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputText.trim()}
            style={{
              background: inputText.trim() ? '#f97316' : 'rgba(255, 255, 255, 0.06)',
              color: inputText.trim() ? '#000' : 'rgba(255, 255, 255, 0.3)',
              border: 'none',
              borderRadius: '6px',
              padding: '0 20px',
              cursor: inputText.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 700,
              fontSize: '0.88rem',
              fontFamily: 'var(--moto-font-display, "Chakra Petch")',
              transition: 'all 0.15s ease',
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
