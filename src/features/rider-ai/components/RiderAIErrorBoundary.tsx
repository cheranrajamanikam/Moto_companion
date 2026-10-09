import { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlertIcon } from './icons';

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

export class RiderAIErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[Rider AI Error Boundary] Caught error:', error, errorInfo);
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
            padding: '16px 20px',
            margin: '8px 0',
            color: 'var(--moto-text-primary, #f4f4f7)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--moto-red, #ef4444)' }}>
            <ShieldAlertIcon size={18} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              {this.props.fallbackTitle || 'Display Advisory Notice'}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--moto-text-secondary, #9ca3af)', lineHeight: 1.45 }}>
            {this.props.fallbackMessage ||
              'A temporary display issue occurred while rendering this card. Your session and messages remain secure.'}
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
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '6px 14px',
                cursor: 'pointer',
              }}
            >
              Reload View
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
