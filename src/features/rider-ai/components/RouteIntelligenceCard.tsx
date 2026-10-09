import React from 'react';
import { RouteContext, HazardContext, WeatherContext } from '../types';
import { MountainIcon, CornerTurnIcon, HazardIcon, ShieldCheckIcon, CloudRainIcon } from './icons';

interface RouteIntelligenceCardProps {
  route?: RouteContext;
  hazards?: HazardContext[];
  weather?: WeatherContext;
}

export const RouteIntelligenceCard: React.FC<RouteIntelligenceCardProps> = ({
  route,
  hazards = [],
  weather,
}) => {
  const difficulty = route?.difficulty || 'moderate';
  const elevation = route?.elevationGainM ? `+${route.elevationGainM}m` : '+1180m';
  const sharpTurns = route?.sharpTurns ?? 12;
  const hazardCount = hazards.length;
  const safetyScore = route?.safetyScore ?? 82;

  return (
    <div className="moto-card">
      <div className="moto-card-header">
        <span className="moto-card-category">
          <ShieldCheckIcon size={14} />
          Route Intelligence
        </span>
      </div>

      <div className="route-intel-grid">
        {/* Difficulty */}
        <div className="intel-stat-box">
          <span className="intel-stat-label">Difficulty</span>
          <span className="intel-stat-value" style={{ textTransform: 'capitalize' }}>
            {difficulty}
          </span>
        </div>

        {/* Elevation Gain */}
        <div className="intel-stat-box">
          <span className="intel-stat-label">
            <MountainIcon size={11} style={{ display: 'inline', marginRight: 4 }} />
            Elevation
          </span>
          <span className="intel-stat-value">{elevation}</span>
        </div>

        {/* Sharp Turns */}
        <div className="intel-stat-box">
          <span className="intel-stat-label">
            <CornerTurnIcon size={11} style={{ display: 'inline', marginRight: 4 }} />
            Sharp Turns
          </span>
          <span className="intel-stat-value">{sharpTurns}</span>
        </div>

        {/* Hazards */}
        <div className="intel-stat-box">
          <span className="intel-stat-label">
            <HazardIcon size={11} style={{ display: 'inline', marginRight: 4, color: 'var(--moto-orange)' }} />
            Hazards
          </span>
          <span className="intel-stat-value" style={{ color: hazardCount > 0 ? 'var(--moto-orange)' : '#fff' }}>
            {hazardCount}
          </span>
        </div>
      </div>

      {/* Safety Score Bar */}
      <div className="intel-safety-bar-wrap">
        <div className="intel-safety-header">
          <span className="intel-safety-title">Corridor Safety Score</span>
          <span className="intel-safety-score">{safetyScore}/100</span>
        </div>
        <div className="intel-safety-track">
          <div className="intel-safety-fill" style={{ width: `${Math.min(100, Math.max(0, safetyScore))}%` }} />
        </div>
      </div>

      {/* Weather & Road condition preview */}
      {weather?.isAvailable && (
        <div
          style={{
            marginTop: 14,
            padding: '10px 14px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--moto-radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem',
            color: 'var(--moto-text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CloudRainIcon size={14} style={{ color: 'var(--moto-orange)' }} />
            <span>
              Weather: <strong>{weather.condition}</strong> ({weather.temperatureC}°C, {weather.rainProbability}% rain)
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--moto-text-muted)' }}>
            Road: {route?.roadCondition ? route.roadCondition.toUpperCase() : 'SURFACE GOOD'}
          </span>
        </div>
      )}
    </div>
  );
};
