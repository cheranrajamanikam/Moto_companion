import React from 'react';
import { AlternativeRouteCardData } from '../types';
import { CompassIcon } from './icons';

interface AlternativeRouteCardProps {
  data: AlternativeRouteCardData;
  onApplyRoute?: () => void;
}

export const AlternativeRouteCard: React.FC<AlternativeRouteCardProps> = ({
  data,
  onApplyRoute,
}) => {
  const altKm = typeof data?.alternativeDistanceKm === 'number' ? data.alternativeDistanceKm : 250;
  const origKm = typeof data?.originalDistanceKm === 'number' ? data.originalDistanceKm : 247;
  const diffKm = altKm - origKm;
  const diffKmFormatted = diffKm >= 0 ? `+${diffKm}` : `${diffKm}`;
  const safetyDelta = typeof data?.safetyDelta === 'number' ? data.safetyDelta : 5;
  const safetyScore = typeof data?.safetyScore === 'number' ? data.safetyScore : 90;
  const timeDelta = typeof data?.timeDeltaMinutes === 'number' ? data.timeDeltaMinutes : 15;
  const alternativeName = data?.alternativeName || 'Alternative Route Corridor';

  return (
    <div className="structured-card">
      <div className="structured-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CompassIcon size={14} style={{ color: 'var(--moto-orange)' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Recommended Alternative Corridor
          </span>
        </div>
        <span className="structured-card-badge low">
          +{safetyDelta} SAFETY SCORE
        </span>
      </div>

      <div>
        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>
          {alternativeName}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--moto-text-secondary)', marginTop: 2 }}>
          {altKm} km ({diffKmFormatted} km) · +{timeDelta} mins travel time
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 10px',
          background: 'rgba(255, 255, 255, 0.025)',
          borderRadius: 'var(--moto-radius-sm)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--moto-text-muted)', textTransform: 'uppercase' }}>
            Safety Score:
          </span>
          <div style={{ fontFamily: 'var(--moto-font-display)', fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>
            {safetyScore} / 100
          </div>
        </div>
        <div style={{ borderLeft: '1px solid var(--moto-border-subtle)', paddingLeft: 12 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--moto-text-muted)', textTransform: 'uppercase' }}>
            Scenic Highway Pass:
          </span>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
            {data.highlightPass || 'Gentle Grade Corridor'}
          </div>
        </div>
      </div>

      <div>
        <span style={{ fontSize: '0.72rem', color: 'var(--moto-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Why this recommendation?
        </span>
        <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: 'var(--moto-text-secondary)', lineHeight: 1.45 }}>
          {data.reason}
        </p>
      </div>

      {onApplyRoute && (
        <div style={{ marginTop: 2 }}>
          <button
            type="button"
            className="structured-card-btn"
            onClick={onApplyRoute}
          >
            Review Alternative on Map →
          </button>
        </div>
      )}
    </div>
  );
};
