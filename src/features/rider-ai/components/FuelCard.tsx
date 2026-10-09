import React from 'react';
import { FuelCardData } from '../types';
import { FuelIcon } from './icons';

interface FuelCardProps {
  data: FuelCardData;
}

export const FuelCard: React.FC<FuelCardProps> = ({ data }) => {
  const stops = Array.isArray(data?.stops) ? data.stops : [];

  return (
    <div className="structured-card">
      <div className="structured-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FuelIcon size={14} style={{ color: 'var(--moto-orange)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
            Verified Highway Fuel Stops
          </span>
        </div>
        {data?.rangeRemainingKm !== undefined && (
          <span style={{ fontSize: '0.75rem', color: 'var(--moto-orange)', fontWeight: 600 }}>
            Est Range: {data.rangeRemainingKm} km
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {stops.map((stop, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              background: 'rgba(255, 255, 255, 0.025)',
              borderRadius: 'var(--moto-radius-sm)',
              border: stop.recommendedRefuel ? '1px solid var(--moto-border-accent)' : '1px solid transparent',
            }}
          >
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#fff' }}>
                {stop?.name || 'Fuel Station'} {stop?.brand ? <span style={{ fontSize: '0.75rem', color: 'var(--moto-text-muted)' }}>({stop.brand})</span> : null}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--moto-text-secondary)' }}>
                {stop?.hasHighOctane ? 'XP95 / Speed Available' : 'Regular 91 RON'} · {stop?.is24Hours ? '24/7 Pump' : 'Closes 10 PM'}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--moto-orange)' }}>
                {stop.distanceKm} km
              </div>
              {stop.recommendedRefuel && (
                <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>
                  RECOMMENDED STOP
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {data.criticalNotice && (
        <div style={{ fontSize: '0.76rem', color: 'var(--moto-yellow)', lineHeight: 1.35 }}>
          Notice: {data.criticalNotice}
        </div>
      )}
    </div>
  );
};
