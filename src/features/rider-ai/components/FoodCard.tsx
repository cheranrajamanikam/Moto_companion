import React from 'react';
import { FoodCardData } from '../types';
import { UtensilsIcon } from './icons';

interface FoodCardProps {
  data: FoodCardData;
}

export const FoodCard: React.FC<FoodCardProps> = ({ data }) => {
  const stops = Array.isArray(data?.stops) ? data.stops : [];

  return (
    <div className="structured-card">
      <div className="structured-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <UtensilsIcon size={14} style={{ color: 'var(--moto-orange)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
            Rider-Recommended Highway Dhabas & Cafes
          </span>
        </div>
        <span className="structured-card-badge low">VERIFIED RIDER PARKING</span>
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
            }}
          >
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#fff' }}>
                {stop?.name || 'Highway Eatery'} {stop?.cuisine ? <span style={{ fontSize: '0.75rem', color: 'var(--moto-text-muted)' }}>({stop.cuisine})</span> : null}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--moto-text-secondary)' }}>
                ⭐ {stop?.rating || '4.0'} · {stop?.hasMotorcycleParking ? 'Secure Paved Bike Parking' : 'Street Parking'} {stop?.restroomCleanliness ? `· Restrooms: ${stop.restroomCleanliness}` : ''}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--moto-orange)' }}>
                {stop.distanceKm} km
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
