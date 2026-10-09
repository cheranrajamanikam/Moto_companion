import React from 'react';
import { RouteApiResult } from '../services/map-api.service';

interface Props {
  primaryRouteName: string;
  primaryDistanceKm: number;
  primaryDurationMinutes: number;
  alternates?: RouteApiResult[];
  activeRouteId: string;
  onSelectRoute: (routeId: string) => void;
}

export const RouteAlternativesCard: React.FC<Props> = ({
  primaryRouteName,
  primaryDistanceKm,
  primaryDurationMinutes,
  alternates = [],
  activeRouteId,
  onSelectRoute,
}) => {
  if (!alternates || alternates.length === 0) {
    return null;
  }

  return (
    <div
      className="route-alternatives-card"
      style={{
        background: 'var(--moto-bg-surface-elevated, #181820)',
        border: '1px solid var(--moto-border-subtle)',
        borderRadius: '10px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: 'var(--moto-font-display, "Chakra Petch", sans-serif)',
            fontSize: '0.86rem',
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.05em',
          }}
        >
          AVAILABLE ROUTE OPTIONS
        </span>
        <span
          style={{
            fontSize: '0.65rem',
            fontFamily: 'var(--moto-font-display, "Chakra Petch", sans-serif)',
            padding: '2px 6px',
            borderRadius: '3px',
            background: 'rgba(255, 107, 0, 0.12)',
            color: 'var(--moto-orange)',
            border: '1px solid rgba(255, 107, 0, 0.3)',
          }}
        >
          {1 + alternates.length} ROUTES
        </span>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--moto-text-muted)', lineHeight: 1.4 }}>
        Geometric road routing. No synthetic congestion or live traffic fabricated.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Primary Route Button */}
        <div
          onClick={() => onSelectRoute('primary')}
          style={{
            background: activeRouteId === 'primary' ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            border: activeRouteId === 'primary' ? '1px solid var(--moto-primary-cyan)' : '1px solid var(--moto-border-subtle)',
            borderRadius: '8px',
            padding: '10px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: activeRouteId === 'primary' ? 'var(--moto-primary-cyan)' : '#fff' }}>
              Primary Route (Recommended)
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--moto-text-muted)' }}>
              {Math.round(primaryDistanceKm)} km · {Math.round(primaryDurationMinutes)} min
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{primaryRouteName}</span>
        </div>

        {/* Alternates */}
        {alternates.map((alt, idx) => {
          const isSelected = activeRouteId === alt.id;
          return (
            <div
              key={alt.id || idx}
              onClick={() => onSelectRoute(alt.id)}
              style={{
                background: isSelected ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: isSelected ? '1px solid var(--moto-primary-cyan)' : '1px solid var(--moto-border-subtle)',
                borderRadius: '8px',
                padding: '10px 12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isSelected ? 'var(--moto-primary-cyan)' : '#fff' }}>
                  {alt.name || `Alternate Route ${idx + 1}`}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--moto-text-muted)' }}>
                  {Math.round(alt.distanceKm)} km · {Math.round(alt.durationMinutes)} min
                </span>
              </div>

              {alt.advantage && (
                <span style={{ fontSize: '0.72rem', color: '#34d399', lineHeight: 1.35 }}>
                  ✓ {alt.advantage}
                </span>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: '#6b7280', marginTop: 2 }}>
                <span>Source: {alt.provenance.source}</span>
                {alt.distanceDeltaKm && (
                  <span style={{ color: alt.distanceDeltaKm > 0 ? '#f59e0b' : '#34d399' }}>
                    {alt.distanceDeltaKm > 0 ? `+${alt.distanceDeltaKm} km` : `${alt.distanceDeltaKm} km`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
