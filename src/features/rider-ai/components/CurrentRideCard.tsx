import React from 'react';
import { RouteContext, RideContext } from '../types';
import { RadioIcon, ArrowRightIcon, CompassIcon } from './icons';

interface CurrentRideCardProps {
  ride?: RideContext;
  route?: RouteContext;
}

export const CurrentRideCard: React.FC<CurrentRideCardProps> = ({ ride, route }) => {
  const origin = ride?.origin || route?.origin || 'Bangalore';
  const destination = ride?.destination || route?.destination || 'Chikmagalur';
  const distanceKm = ride?.totalDistanceKm || route?.distanceKm || 247;
  const durationMins = ride?.estimatedDurationMinutes || route?.durationMinutes || 320;
  const safetyScore = ride?.safetyScore ?? route?.safetyScore ?? 82;
  const status = ride?.status || 'scheduled';

  const hours = Math.floor(durationMins / 60);
  const minutes = durationMins % 60;
  const durationFormatted = `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;

  return (
    <div className="moto-card">
      <div className="moto-card-header">
        <span className="moto-card-category">
          <CompassIcon size={14} />
          Current Ride
        </span>
        <span className="rider-ai-badge-demo">
          <RadioIcon size={11} />
          DEMO DATA
        </span>
      </div>

      <div className="current-ride-route">
        <span className="current-ride-route-name">{origin}</span>
        <ArrowRightIcon size={20} className="text-muted" style={{ color: 'var(--moto-orange)' }} />
        <span className="current-ride-route-name">{destination}</span>
      </div>

      <div className="current-ride-metrics">
        <div className="current-ride-metric-item">
          <span>Distance:</span>
          <strong>{distanceKm} km</strong>
        </div>
        <span style={{ color: 'var(--moto-border-medium)' }}>·</span>
        <div className="current-ride-metric-item">
          <span>Est. Time:</span>
          <strong>{durationFormatted}</strong>
        </div>
        <span style={{ color: 'var(--moto-border-medium)' }}>·</span>
        <div className="current-ride-metric-item">
          <span>Safety:</span>
          <strong style={{ color: 'var(--moto-orange)' }}>{safetyScore}/100</strong>
        </div>
      </div>

      <div className="current-ride-footer">
        <div>
          <span>Status: </span>
          <span className={`status-indicator ${status}`}>
            {status === 'scheduled' ? 'Scheduled Departure' : status}
          </span>
        </div>
        <div>
          <span>Departure: <strong>{ride?.departureTime || '06:00 AM IST'}</strong></span>
        </div>
      </div>
    </div>
  );
};
