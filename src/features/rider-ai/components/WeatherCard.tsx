import React from 'react';
import { WeatherCardData } from '../types';
import { CloudRainIcon } from './icons';

interface WeatherCardProps {
  data: WeatherCardData;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ data }) => {
  const temp = typeof data?.temperatureC === 'number' ? data.temperatureC : 24;
  const condition = data?.condition || 'Partly Cloudy';
  const rainProb = typeof data?.rainProbability === 'number' ? data.rainProbability : 30;

  return (
    <div className="structured-card">
      <div className="structured-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CloudRainIcon size={14} style={{ color: 'var(--moto-orange)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
            Atmospheric & Radar Conditions
          </span>
        </div>
        <span
          className="structured-card-badge"
          style={{ background: 'rgba(255, 255, 255, 0.06)', color: '#fff' }}
        >
          {temp}°C · {condition}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', color: 'var(--moto-text-secondary)' }}>
        <div>
          Rain Probability: <strong style={{ color: rainProb > 40 ? 'var(--moto-orange)' : '#fff' }}>{rainProb}%</strong>
        </div>
        {data?.windSpeedKmh && <div>Wind: <strong>{data.windSpeedKmh} km/h</strong></div>}
        {data?.visibilityKm && <div>Visibility: <strong>{data.visibilityKm} km</strong></div>}
      </div>

      {data?.ridingRecommendation && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '8px 12px',
            borderRadius: 'var(--moto-radius-sm)',
            fontSize: '0.82rem',
            color: 'var(--moto-text-primary)',
            lineHeight: 1.4,
          }}
        >
          <strong>Riding Recommendation:</strong> {data.ridingRecommendation}
        </div>
      )}

      {data?.cautionWindow && (
        <span style={{ fontSize: '0.74rem', color: 'var(--moto-text-muted)' }}>
          Target Window: {data.cautionWindow}
        </span>
      )}
    </div>
  );
};
