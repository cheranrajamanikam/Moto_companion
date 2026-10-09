import React from 'react';
import { RiderContext, BikeContext } from '../types';
import { UserIcon, MotoLogoIcon } from './icons';

interface RiderContextCardProps {
  rider?: RiderContext;
  bike?: BikeContext;
}

export const RiderContextCard: React.FC<RiderContextCardProps> = ({ rider, bike }) => {
  return (
    <div className="moto-card">
      <div className="moto-card-header" style={{ marginBottom: 12 }}>
        <span className="moto-card-category">Rider & Bike Profile</span>
      </div>

      <div className="rider-bike-card">
        {/* Rider Info */}
        <div className="rider-bike-col">
          <span className="rider-bike-label">
            <UserIcon size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            Rider
          </span>
          <span className="rider-bike-name">{rider?.name || 'Demo Rider'}</span>
          <span className="rider-bike-sub" style={{ textTransform: 'capitalize' }}>
            Level: {rider?.experienceLevel || 'Intermediate'} · {rider?.totalRidesLogged || 47} rides
          </span>
        </div>

        {/* Bike Info */}
        <div className="rider-bike-col">
          <span className="rider-bike-label">
            <MotoLogoIcon size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            Motorcycle
          </span>
          <span className="rider-bike-name">
            {bike?.brand} {bike?.model}
          </span>
          <span className="rider-bike-sub">
            {bike?.engineCc}cc · {bike?.hasABS ? 'Dual-Channel ABS' : 'Standard'}
          </span>
        </div>
      </div>
    </div>
  );
};
