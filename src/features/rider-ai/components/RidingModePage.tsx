import React from 'react';
import { RouteContext, HazardContext } from '../types';
import { MotoLogoIcon, HazardIcon, ArrowRightIcon } from './icons';

interface RidingModePageProps {
  route?: RouteContext;
  hazards?: HazardContext[];
  onExitRidingMode: () => void;
}

export const RidingModePage: React.FC<RidingModePageProps> = ({
  route,
  hazards = [],
  onExitRidingMode,
}) => {
  const nextHazard = hazards[0];

  return (
    <div
      className="rider-ai-scope"
      style={{
        minHeight: '100vh',
        backgroundColor: '#000000',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Cockpit Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: 'var(--moto-orange)',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MotoLogoIcon size={18} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--moto-font-display)', fontSize: '1.2rem', fontWeight: 700 }}>
              COCKPIT MODE
            </div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
              High-Visibility Telemetry Active
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onExitRidingMode}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Exit to Intelligence
        </button>
      </div>

      {/* Main Glanceable Area */}
      <div
        style={{
          maxWidth: 960,
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          padding: '28px 0',
        }}
      >
        {/* Next Waypoint Callout */}
        <div
          style={{
            background: '#0d0d12',
            border: '2px solid var(--moto-border-accent)',
            borderRadius: 16,
            padding: '24px 28px',
          }}
        >
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--moto-orange)',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            Current Destination Corridor
          </div>
          <div
            style={{
              fontFamily: 'var(--moto-font-display)',
              fontSize: '2.4rem',
              fontWeight: 700,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <span>{route?.origin || 'Bangalore'}</span>
            <ArrowRightIcon size={28} style={{ color: 'var(--moto-orange)' }} />
            <span>{route?.destination || 'Chikmagalur'}</span>
          </div>
          <div style={{ marginTop: 12, fontSize: '1.05rem', color: 'var(--moto-text-secondary)' }}>
            247 km Total · 12 Technical Hairpins · Elevation +1180m
          </div>
        </div>

        {/* Hazard Alert Banner (Glanceable) */}
        {nextHazard ? (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '2px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 16,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <HazardIcon size={26} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase' }}>
                Next Hazard: in {nextHazard.distanceKm} km ({(nextHazard?.severity || 'medium').toUpperCase()} SEVERITY)
              </div>
              <div style={{ fontFamily: 'var(--moto-font-display)', fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
                {nextHazard.type}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--moto-text-primary)', marginTop: 2 }}>
                {nextHazard.recommendation}
              </div>
            </div>
          </div>
        ) : null}

        {/* Live Hardware Notice (Honesty Rule) */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: '16px 20px',
            fontSize: '0.86rem',
            color: 'var(--moto-text-muted)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: 'var(--moto-text-secondary)' }}>Note on Real-Time Telemetry:</strong> Live speedometer, active lean angle, crash detection accelerometer, and real-time turn-by-turn navigation require Bluetooth OBD/GPS hardware pairing (to be supplied by Member 1). Currently displaying simulated pre-trip corridor data.
        </div>
      </div>

      {/* Footer Return Action */}
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <button
          type="button"
          onClick={onExitRidingMode}
          className="moto-btn-get-started"
          style={{ padding: '12px 28px', fontSize: '0.95rem' }}
        >
          Return to Riding Companion Hub
        </button>
      </div>
    </div>
  );
};
