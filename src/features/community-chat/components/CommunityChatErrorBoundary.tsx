import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CommunityChatErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[Community Chat Error Boundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--moto-radius-md, 10px)',
            padding: '20px 24px',
            margin: '16px auto',
            maxWidth: '680px',
            color: 'var(--moto-text-primary, #f4f4f7)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            fontFamily: 'var(--moto-font-body, "Inter Tight", sans-serif)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--moto-red, #ef4444)' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <span
              style={{
                fontFamily: 'var(--moto-font-display, "Chakra Petch", sans-serif)',
                fontWeight: 700,
                fontSize: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {this.props.fallbackTitle || 'Community Chat Display Advisory'}
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '0.88rem',
              color: 'var(--moto-text-secondary, #9ca3af)',
              lineHeight: 1.5,
            }}
          >
            {this.props.fallbackMessage ||
              'A temporary display issue occurred in the rider chat channel. Your connection and message data remain safe.'}
          </p>
          <div>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 'var(--moto-radius-sm, 6px)',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 600,
                padding: '8px 16px',
                cursor: 'pointer',
                fontFamily: 'var(--moto-font-body, "Inter Tight", sans-serif)',
                transition: 'all 0.15s ease',
              }}
            >
              Restore Chat View
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
