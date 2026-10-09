import React from 'react';
import { RouteIntelligence } from '../types/route-intelligence.types';

interface Props {
  route: RouteIntelligence;
}

export const RouteSummaryHeader: React.FC<Props> = ({ route }) => {
  const hours = Math.floor(route.totalDurationMinutes / 60);
  const minutes = route.totalDurationMinutes % 60;
  const durationFormatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  const difficultyTier =
    route.totalElevationGainM > 2000
      ? 'hard'
      : route.totalElevationGainM > 800
      ? 'moderate'
      : 'easy';

  return (
    <header className="route-summary-header">
      <div className="route-endpoints">
        <span className="route-endpoint-name">{route.origin}</span>
        <span className="route-endpoint-arrow">➔</span>
        <span className="route-endpoint-name">{route.destination}</span>
      </div>

      <div className="route-telemetry-strip">
        <div className="telemetry-item">
          <span className="telemetry-label">Distance</span>
          <span className="telemetry-value">{`${route.totalDistanceKm} km`}</span>
        </div>

        <div className="telemetry-item">
          <span className="telemetry-label">Est. Duration</span>
          <span className="telemetry-value">{durationFormatted}</span>
        </div>

        <div className="telemetry-item">
          <span className="telemetry-label">Elevation Gain</span>
          <span className="telemetry-value">{`+${route.totalElevationGainM} m`}</span>
        </div>

        <div className="telemetry-item" style={{ justifyContent: 'center' }}>
          <span className={`difficulty-pill ${difficultyTier}`}>
            {`${difficultyTier} corridor`}
          </span>
        </div>
      </div>
    </header>
  );
};
