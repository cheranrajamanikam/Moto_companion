import React from 'react';
import { RidePreparationCardData } from '../types';
import { ShieldAlertIcon } from './icons';

interface RidePreparationCardProps {
  data: RidePreparationCardData;
}

export const RidePreparationCard: React.FC<RidePreparationCardProps> = ({ data }) => {
  const gearChecklist = Array.isArray(data?.gearChecklist) ? data.gearChecklist : [];
  const bikePreTripChecks = Array.isArray(data?.bikePreTripChecks) ? data.bikePreTripChecks : [];
  const documentsRequired = Array.isArray(data?.documentsRequired) ? data.documentsRequired : [];

  return (
    <div className="structured-card">
      <div className="structured-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldAlertIcon size={14} style={{ color: 'var(--moto-orange)' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Pre-Ride Readiness & Checklist
          </span>
        </div>
        <span className="structured-card-badge low">ESSENTIAL GEAR</span>
      </div>

      {/* Mandatory Gear Checklist */}
      {gearChecklist.length > 0 && (
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--moto-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Mandatory Safety Gear:
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
            {gearChecklist.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.8rem',
                  color: 'var(--moto-text-primary)',
                }}
              >
                <span style={{ color: '#10b981', fontSize: '0.85rem' }}>✓</span>
                <span>{typeof item === 'string' ? item : (item?.item || 'Essential Gear Item')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pre-Trip Bike Inspection */}
      {bikePreTripChecks.length > 0 && (
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--moto-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Motorcycle Pre-Departure Checks:
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
            {bikePreTripChecks.map((check, i) => (
              <div
                key={i}
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--moto-text-secondary)',
                  padding: '4px 8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--moto-radius-sm)',
                }}
              >
                <strong style={{ color: '#fff' }}>{typeof check === 'string' ? check : (check?.check || 'Check')}:</strong>{' '}
                {typeof check === 'object' && check !== null ? (check?.details || '') : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Required */}
      {documentsRequired.length > 0 && (
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--moto-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Required Documents:
          </span>
          <div style={{ fontSize: '0.78rem', color: 'var(--moto-text-secondary)', marginTop: 2 }}>
            {documentsRequired.map((d: any) => (typeof d === 'string' ? d : (d?.name || String(d)))).join(' · ')}
          </div>
        </div>
      )}

      {/* Critical Emergency Notes */}
      {data.criticalEmergencyNotes && (
        <div
          style={{
            fontSize: '0.76rem',
            color: 'var(--moto-yellow)',
            background: 'rgba(234, 179, 8, 0.08)',
            padding: '6px 10px',
            borderRadius: 'var(--moto-radius-sm)',
            borderLeft: '2px solid var(--moto-yellow)',
            lineHeight: 1.35,
          }}
        >
          {data.criticalEmergencyNotes}
        </div>
      )}
    </div>
  );
};
