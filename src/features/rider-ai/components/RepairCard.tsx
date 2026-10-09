import React from 'react';
import { RepairCardData } from '../types';
import { WrenchIcon } from './icons';

interface RepairCardProps {
  data: RepairCardData;
}

export const RepairCard: React.FC<RepairCardProps> = ({ data }) => {
  const shops = Array.isArray(data?.shops) ? data.shops : [];

  return (
    <div className="structured-card">
      <div className="structured-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <WrenchIcon size={14} style={{ color: 'var(--moto-orange)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
            Emergency Motorcycle Recovery & Repair
          </span>
        </div>
        <span className="structured-card-badge medium">HIGHWAY EMERGENCY</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {shops.map((shop, i) => (
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
                {shop?.name || 'Motorcycle Repair'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--moto-text-secondary)' }}>
                {shop?.specialization || 'General Service'} {shop?.phone ? `· Phone: ${shop.phone}` : ''}
              </div>
              {shop?.hasTowService && (
                <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>
                  TOW TRUCK / RECOVERY TRUCK AVAILABLE
                </span>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--moto-orange)' }}>
                {shop.distanceKm} km
              </div>
              <span style={{ fontSize: '0.72rem', color: shop.openNow ? '#10b981' : 'var(--moto-red)' }}>
                {shop.openNow ? 'OPEN NOW' : 'CLOSED'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
