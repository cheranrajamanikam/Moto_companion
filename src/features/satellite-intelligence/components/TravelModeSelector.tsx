import React from 'react';

export type TravelMode = 'two-wheeler' | 'car' | 'transit' | 'walking';

interface Props {
  activeMode: TravelMode;
  onSelectMode: (mode: TravelMode) => void;
  twoWheelerDurationMinutes?: number;
  carDurationMinutes?: number;
  transitDurationMinutes?: number;
  walkingDurationMinutes?: number;
  routeDistanceKm?: number;
}

export const TravelModeSelector: React.FC<Props> = ({
  activeMode,
  onSelectMode,
  twoWheelerDurationMinutes,
  carDurationMinutes,
  transitDurationMinutes,
  walkingDurationMinutes,
  routeDistanceKm,
}) => {
  const formatDuration = (mins?: number): string => {
    if (!mins || mins <= 0) return '--';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className="travel-mode-section" data-testid="travel-mode-section">
      <div className="travel-mode-selector-container" data-testid="travel-mode-selector">
        {/* 1. Two-Wheeler / Motorcycle (Primary & Default) */}
        <button
          type="button"
          className={`travel-mode-pill two-wheeler ${activeMode === 'two-wheeler' ? 'active' : ''}`}
          onClick={() => onSelectMode('two-wheeler')}
          title="Motorcycle / Two-Wheeler Route (Primary Mode · Road-Driving Profile)"
          data-testid="mode-pill-two-wheeler"
        >
          <span className="mode-icon">🏍️</span>
          <span className="mode-label">Two-Wheeler</span>
          {twoWheelerDurationMinutes && (
            <span className="mode-duration">{formatDuration(twoWheelerDurationMinutes)}</span>
          )}
        </button>

        {/* 2. Car */}
        <button
          type="button"
          className={`travel-mode-pill car ${activeMode === 'car' ? 'active' : ''}`}
          onClick={() => onSelectMode('car')}
          title="Car Route (Road-Driving Profile)"
          data-testid="mode-pill-car"
        >
          <span className="mode-icon">🚗</span>
          <span className="mode-label">Car</span>
          {carDurationMinutes && (
            <span className="mode-duration">{formatDuration(carDurationMinutes)}</span>
          )}
        </button>

        {/* 3. Public Transit */}
        <button
          type="button"
          className={`travel-mode-pill transit ${activeMode === 'transit' ? 'active' : ''}`}
          onClick={() => onSelectMode('transit')}
          title="Public Transit Route"
          data-testid="mode-pill-transit"
        >
          <span className="mode-icon">🚌</span>
          <span className="mode-label">Transit</span>
          {transitDurationMinutes && (
            <span className="mode-duration">{formatDuration(transitDurationMinutes)}</span>
          )}
        </button>

        {/* 4. Walking */}
        <button
          type="button"
          className={`travel-mode-pill walking ${activeMode === 'walking' ? 'active' : ''}`}
          onClick={() => onSelectMode('walking')}
          title="Walking Route"
          data-testid="mode-pill-walking"
        >
          <span className="mode-icon">🚶</span>
          <span className="mode-label">Walking</span>
          {walkingDurationMinutes && (
            <span className="mode-duration">{formatDuration(walkingDurationMinutes)}</span>
          )}
        </button>
      </div>

      {/* Corridor-Specific Route & Provider Limitation Notices */}
      {activeMode === 'transit' && (
        <div className="travel-mode-notice" data-testid="transit-route-notice">
          <span className="notice-icon">🚌</span>
          <span className="notice-text">
            <strong>Transit Route Notice:</strong> Direct transit geometry is limited for this inter-city highway corridor by open router data. Regional KSRTC bus and rail connections operate between major city terminals.
          </span>
        </div>
      )}
      {activeMode === 'walking' && (
        <div className="travel-mode-notice" data-testid="walking-route-notice">
          <span className="notice-icon">🚶</span>
          <span className="notice-text">
            <strong>Walking Route Notice:</strong> Inter-city distance ({routeDistanceKm ? Math.round(routeDistanceKm) + ' km' : 'long distance'}) exceeds single-stage pedestrian walking limits on expressway corridors. Local walking paths remain available for urban destinations.
          </span>
        </div>
      )}
    </div>
  );
};
