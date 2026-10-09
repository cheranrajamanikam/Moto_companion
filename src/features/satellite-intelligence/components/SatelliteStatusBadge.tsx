import React from 'react';
import { SatelliteStatus } from '../types/route-intelligence.types';
import { SatelliteIcon } from './icons';

interface Props {
  status?: SatelliteStatus;
}

export const SatelliteStatusBadge: React.FC<Props> = ({ status }) => {
  return (
    <div className="satellite-status-badge" title="Source status for orbital imagery layer">
      <span className="satellite-status-dot" />
      <SatelliteIcon size={13} style={{ color: 'var(--moto-orange)' }} />
      <span>SATELLITE IMAGERY · UPDATED PERIODICALLY</span>
      {status?.cloudCoverPercent !== undefined && (
        <span style={{ color: 'var(--moto-text-muted)', fontSize: '0.68rem' }}>
          ({status.cloudCoverPercent}% Cloud)
        </span>
      )}
    </div>
  );
};
