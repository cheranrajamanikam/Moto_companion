import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangleIcon } from './icons';

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

export class SatelliteIntelligenceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SatelliteIntelligenceErrorBoundary] Caught map/render failure:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: '#0a0a0d',
            color: '#f4f4f7',
            fontFamily: 'var(--moto-font-body, "Inter Tight", sans-serif)',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              background: '#121217',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '24px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                padding: '12px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                marginBottom: '16px',
              }}
            >
              <AlertTriangleIcon size={32} />
            </div>

            <h3
              style={{
                fontFamily: 'var(--moto-font-display, "Chakra Petch", sans-serif)',
                fontSize: '1.15rem',
                margin: '0 0 8px 0',
                color: '#fff',
              }}
            >
              {this.props.fallbackTitle || 'Satellite Intelligence Display Advisory'}
            </h3>

            <p
              style={{
                fontSize: '0.85rem',
                lineHeight: 1.5,
                color: '#9ca3af',
                margin: '0 0 20px 0',
              }}
            >
              {this.props.fallbackMessage ||
                'A display or WebGL graphics context issue occurred while rendering the interactive route map. Your route and hazard data remain secure.'}
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  background: '#f97316',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 18px',
                  fontFamily: 'var(--moto-font-display, "Chakra Petch", sans-serif)',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                Restore Map View
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
