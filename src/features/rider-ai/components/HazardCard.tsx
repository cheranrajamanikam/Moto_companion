import React from 'react';
import { HazardCardData } from '../types';
import { HazardIcon, MapPinIcon } from './icons';

interface HazardCardProps {
  data: HazardCardData;
  onViewMap?: (hazardId?: string) => void;
  onFindSaferRoute?: () => void;
}

export const HazardCard: React.FC<HazardCardProps> = ({ data, onViewMap, onFindSaferRoute }) => {
  const severity = (data?.severity || 'medium').toString().toLowerCase();
  const badgeClass =
    severity === 'high' ? 'high' : severity === 'medium' ? 'medium' : 'low';
  const hazardType = data?.hazardType || 'Road Hazard';
  const description = data?.description || '';

  return (
    <div className="structured-card">
      <div className="structured-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <HazardIcon size={14} style={{ color: 'var(--moto-orange)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
            {hazardType}
          </span>
        </div>
        <span className={`structured-card-badge ${badgeClass}`}>
          {severity.toUpperCase()} SEVERITY
        </span>
      </div>

      <div style={{ fontSize: '0.78rem', color: 'var(--moto-text-muted)' }}>
        {data?.locationName && <span>{data.locationName} · </span>}
        {data?.distanceAheadKm !== undefined && <span>{data.distanceAheadKm} km ahead</span>}
      </div>

      {description && (
        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--moto-text-secondary)', lineHeight: 1.45 }}>
          {description}
        </p>
      )}

      {data.precaution && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '8px 12px',
            borderRadius: 'var(--moto-radius-sm)',
            borderLeft: '3px solid var(--moto-orange)',
            fontSize: '0.8rem',
            color: 'var(--moto-text-primary)',
          }}
        >
          <strong>Precaution:</strong> {data.precaution}
        </div>
      )}

      <div className="structured-card-actions">
        <button
          type="button"
          className="card-action-btn"
          onClick={() => onViewMap && onViewMap(data.hazardId)}
        >
          <MapPinIcon size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
          View on Map
        </button>
        <button
          type="button"
          className="card-action-btn"
          onClick={() => onFindSaferRoute && onFindSaferRoute()}
        >
          Find Safer Route
        </button>
      </div>
    </div>
  );
};
