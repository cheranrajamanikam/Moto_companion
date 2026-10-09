import React from 'react';
import { RouteSafetyCardData } from '../types';
import { ShieldAlertIcon } from './icons';

interface RouteSafetyCardProps {
  data: RouteSafetyCardData;
}

export const RouteSafetyCard: React.FC<RouteSafetyCardProps> = ({ data }) => {
  const riskLevel = (data?.riskLevel || 'moderate').toString().toLowerCase();
  const badgeClass =
    riskLevel === 'high' || riskLevel === 'critical'
      ? 'high'
      : riskLevel === 'moderate'
      ? 'medium'
      : 'low';
  const riskIndicators = Array.isArray(data?.riskIndicators) ? data.riskIndicators : [];
  const safetyScore = typeof data?.safetyScore === 'number' ? data.safetyScore : 82;
  const explanation = data?.explanation || '';

  return (
    <div className="structured-card">
      <div className="structured-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldAlertIcon size={14} style={{ color: 'var(--moto-orange)' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Route Safety Assessment
          </span>
        </div>
        <span className={`structured-card-badge ${badgeClass}`}>
          {riskLevel.toUpperCase()} RISK
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: 'var(--moto-font-display)', fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>
          {safetyScore}
        </span>
        <span style={{ fontSize: '0.9rem', color: 'var(--moto-text-muted)' }}>/ 100 Corridor Safety Score</span>
      </div>

      {explanation && (
        <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--moto-text-secondary)', lineHeight: 1.45 }}>
          {explanation}
        </p>
      )}

      {riskIndicators.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--moto-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Key Factors:
          </span>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.82rem', color: 'var(--moto-text-secondary)' }}>
            {riskIndicators.map((ind, i) => (
              <li key={i}>{ind}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
