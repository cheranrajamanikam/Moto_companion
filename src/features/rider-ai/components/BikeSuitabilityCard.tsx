import React from 'react';
import { BikeSuitabilityCardData } from '../types';
import { ShieldCheckIcon } from './icons';

interface BikeSuitabilityCardProps {
  data: BikeSuitabilityCardData;
}

export const BikeSuitabilityCard: React.FC<BikeSuitabilityCardProps> = ({ data }) => {
  const rating = (data?.rating || 'capable').toString().toLowerCase();
  const badgeClass =
    rating === 'ideal' ? 'low' : rating === 'capable' ? 'medium' : 'high';
  const bikeModel = data?.bikeModel || 'Motorcycle';
  const suitabilityScore = typeof data?.suitabilityScore === 'number' ? data.suitabilityScore : 90;
  const matchedFactors = Array.isArray(data?.matchedFactors) ? data.matchedFactors : [];
  const potentialChallenges = Array.isArray(data?.potentialChallenges) ? data.potentialChallenges : [];
  const recommendation = data?.recommendation || '';

  return (
    <div className="structured-card">
      <div className="structured-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldCheckIcon size={14} style={{ color: 'var(--moto-orange)' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Machine Suitability: {bikeModel}
          </span>
        </div>
        <span className={`structured-card-badge ${badgeClass}`}>
          {rating.toUpperCase()} MATCH
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: 'var(--moto-font-display)', fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>
          {suitabilityScore}
        </span>
        <span style={{ fontSize: '0.9rem', color: 'var(--moto-text-muted)' }}>/ 100 Terrain Compatibility Score</span>
      </div>

      {recommendation && (
        <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--moto-text-secondary)', lineHeight: 1.45 }}>
          {recommendation}
        </p>
      )}

      {matchedFactors.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--moto-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Chassis & Terrain Strengths:
          </span>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.82rem', color: 'var(--moto-text-secondary)' }}>
            {matchedFactors.map((factor, i) => (
              <li key={i}>{factor}</li>
            ))}
          </ul>
        </div>
      )}

      {potentialChallenges.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--moto-yellow)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Limitations & Watchpoints:
          </span>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.82rem', color: 'var(--moto-text-secondary)' }}>
            {potentialChallenges.map((challenge, i) => (
              <li key={i}>{challenge}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
