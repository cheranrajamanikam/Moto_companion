import React from 'react';

interface Props {
  speedMps?: number | null; // meters per second from browser GeolocationCoordinates.speed
}

export const SpeedIndicatorHUD: React.FC<Props> = ({ speedMps }) => {
  // Convert meters per second to kilometers per hour if available and valid
  const speedKmh =
    speedMps !== null && speedMps !== undefined && !isNaN(speedMps) && speedMps >= 0
      ? Math.round(speedMps * 3.6)
      : null;

  return (
    <div className="speed-indicator-hud" data-testid="speed-indicator-hud" title="Live GPS Speedometer">
      <div className="speed-gauge-circle">
        <span className="speed-value" data-testid="speed-value">
          {speedKmh !== null ? speedKmh : '--'}
        </span>
        <span className="speed-unit">km/h</span>
      </div>
    </div>
  );
};
