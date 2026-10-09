import React from 'react';
import { RouteWeatherPoint, RouteWeatherSummary } from '../services/map-api.service';

interface Props {
  weather: RouteWeatherSummary | null;
  onSelectCheckpoint?: (point: RouteWeatherPoint) => void;
  selectedCheckpointName?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const RouteWeatherCard: React.FC<Props> = ({
  weather,
  onSelectCheckpoint,
  selectedCheckpointName,
  isExpanded = true,
  onToggleExpand,
}) => {
  if (!weather) {
    return (
      <div
        className="route-weather-card"
        style={{
          background: 'var(--moto-bg-surface-elevated, #181820)',
          border: '1px solid var(--moto-border-subtle)',
          borderRadius: '10px',
          padding: '14px',
          color: 'var(--moto-text-muted)',
          fontSize: '0.8rem',
          textAlign: 'center',
        }}
      >
        Connecting to Open-Meteo corridor weather...
      </div>
    );
  }

  const freshnessLabel =
    weather.provenance.freshness === 'live/current'
      ? 'LIVE/CURRENT'
      : weather.provenance.freshness === 'cached'
      ? 'CACHED'
      : weather.provenance.freshness === 'recent'
      ? 'RECENT'
      : 'DEMO DATA';

  const freshnessColor =
    weather.provenance.freshness === 'recent' || weather.provenance.freshness === 'live/current'
      ? '#34d399'
      : '#f59e0b';

  return (
    <div
      className="route-weather-card"
      style={{
        background: 'var(--moto-bg-surface-elevated, #181820)',
        border: '1px solid var(--moto-border-subtle)',
        borderRadius: '10px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontFamily: 'var(--moto-font-display, "Chakra Petch", sans-serif)',
              fontSize: '0.86rem',
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '0.05em',
            }}
          >
            ROUTE WEATHER INTELLIGENCE
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: '0.65rem',
              fontFamily: 'var(--moto-font-display, "Chakra Petch", sans-serif)',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '3px',
              background: 'rgba(255, 255, 255, 0.06)',
              color: freshnessColor,
              border: `1px solid ${freshnessColor}44`,
            }}
          >
            {freshnessLabel}
          </span>
          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--moto-text-muted)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                padding: '2px 4px',
              }}
            >
              {isExpanded ? '▲' : '▼'}
            </button>
          )}
        </div>
      </div>

      {/* Honest Provenance Attribution */}
      <div
        style={{
          fontSize: '0.68rem',
          color: 'var(--moto-text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '4px 8px',
          borderRadius: '4px',
        }}
      >
        <span>SOURCE: Open-Meteo · UPDATED PERIODICALLY</span>
        <span>Max Rain: <strong style={{ color: weather.maxRainProbability > 40 ? '#f59e0b' : '#34d399' }}>{weather.maxRainProbability}%</strong></span>
      </div>

      {/* Advisory */}
      <div
        style={{
          background: weather.maxRainProbability > 40 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
          borderLeft: `3px solid ${weather.maxRainProbability > 40 ? '#f59e0b' : '#34d399'}`,
          padding: '8px 10px',
          borderRadius: '0 6px 6px 0',
          fontSize: '0.74rem',
          color: '#d1d5db',
          lineHeight: 1.4,
        }}
      >
        <div style={{ fontWeight: 600, color: '#fff', marginBottom: 2 }}>{weather.overallCondition}</div>
        <div>{weather.advisory}</div>
      </div>

      {/* Checkpoints List */}
      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span
            style={{
              fontFamily: 'var(--moto-font-display, "Chakra Petch", sans-serif)',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--moto-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Corridor Micro-Climate Checkpoints ({weather.checkpoints.length})
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {weather.checkpoints.map((pt) => {
              const isSelected = selectedCheckpointName === pt.locationName;
              const gripColor =
                pt.roadGripRisk === 'high'
                  ? '#ef4444'
                  : pt.roadGripRisk === 'moderate'
                  ? '#f59e0b'
                  : '#10b981';

              return (
                <div
                  key={pt.locationName}
                  onClick={() => onSelectCheckpoint && onSelectCheckpoint(pt)}
                  style={{
                    background: isSelected ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected ? '1px solid var(--moto-primary-cyan)' : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    cursor: onSelectCheckpoint ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff' }}>
                      {pt.locationName}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--moto-font-display, "Chakra Petch", sans-serif)',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        color: 'var(--moto-orange)',
                      }}
                    >
                      {pt.temperatureC}°C
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                    <span style={{ color: '#9ca3af' }}>{pt.weatherDescription}</span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: gripColor,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {pt.roadGripRisk === 'high' ? 'High Slip Risk' : pt.roadGripRisk === 'moderate' ? 'Moderate Grip' : 'Optimal Grip'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 12, fontSize: '0.68rem', color: '#6b7280', marginTop: 2 }}>
                    <span>Rain: <strong style={{ color: '#d1d5db' }}>{pt.rainProbabilityPercent}%</strong></span>
                    <span>Wind: <strong style={{ color: '#d1d5db' }}>{pt.windSpeedKmh} km/h</strong></span>
                    <span>Vis: <strong style={{ color: '#d1d5db' }}>{pt.visibilityKm} km</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
