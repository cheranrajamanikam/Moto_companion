import React from 'react';
import { RouteContext, HazardContext } from '../types';
import { CompassIcon, MapPinIcon, HazardIcon } from './icons';

export interface MapSurfaceProps {
  route?: RouteContext;
  hazards?: HazardContext[];
  onViewMap?: () => void;
  onViewHazard?: (hazardId: string) => void;
  onFindAlternative?: () => void;
  onRouteSelect?: (routeId: string) => void;
}

export const MapSurface: React.FC<MapSurfaceProps> = ({
  route,
  hazards = [],
  onViewMap,
  onViewHazard,
  onFindAlternative,
  onRouteSelect,
}) => {
  return (
    <div className="map-surface-container">
      {/* Topographical contour vector background */}
      <svg
        className="map-terrain-svg"
        viewBox="0 0 600 280"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="mapRouteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#f97316" stopOpacity="1" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.8" />
          </linearGradient>
          <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#gridPattern)" />

        {/* Topographical contour elevation lines */}
        <path
          d="M -20,180 Q 80,110 180,160 T 380,120 T 620,140"
          fill="none"
          stroke="rgba(249, 115, 22, 0.15)"
          strokeWidth="1.2"
        />
        <path
          d="M -20,220 Q 90,150 200,190 T 410,160 T 620,200"
          fill="none"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth="1"
        />
        <path
          d="M -20,130 Q 120,70 240,110 T 450,80 T 620,100"
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="1"
        />
        <path
          d="M -20,90 Q 140,40 260,70 T 480,40 T 620,60"
          fill="none"
          stroke="rgba(255, 255, 255, 0.04)"
          strokeWidth="1"
        />

        {/* Planned Route Line */}
        <path
          d="M 50,210 Q 140,190 220,140 T 360,120 T 530,70"
          fill="none"
          stroke="url(#mapRouteGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="6 4"
        />

        {/* Origin Waypoint Pin */}
        <circle cx="50" cy="210" r="6" fill="#f97316" />
        <circle cx="50" cy="210" r="14" fill="none" stroke="rgba(249, 115, 22, 0.3)" strokeWidth="1.5" />

        {/* Hazard Marker on Route */}
        <circle cx="270" cy="132" r="5" fill="#ef4444" />
        <circle cx="270" cy="132" r="10" fill="none" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="1" />

        {/* Destination Waypoint Pin */}
        <circle cx="530" cy="70" r="6" fill="#10b981" />
        <circle cx="530" cy="70" r="14" fill="none" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1.5" />
      </svg>

      {/* Surface Overlay with metadata & integration actions */}
      <div className="map-surface-overlay">
        <div className="map-surface-header">
          <div className="map-badge">
            <CompassIcon size={13} style={{ color: 'var(--moto-orange)' }} />
            <span>TERRAIN RADAR · NH75 & MUDIGERE PASS</span>
          </div>

          <div className="map-badge" style={{ background: 'rgba(249, 115, 22, 0.1)', color: 'var(--moto-orange)' }}>
            <span>INTEGRATION BOUNDARY</span>
          </div>
        </div>

        {/* Action triggers for Member 1 integration */}
        <div className="map-actions">
          <button
            type="button"
            className="map-btn primary"
            onClick={() => onViewMap && onViewMap()}
            title="Open full interactive map component (to be linked by Member 1)"
          >
            <MapPinIcon size={14} />
            Inspect Corridor
          </button>

          {hazards.length > 0 && (
            <button
              type="button"
              className="map-btn"
              onClick={() => onViewHazard && onViewHazard(hazards[0].id)}
              title="View next hazard on map"
            >
              <HazardIcon size={14} style={{ color: 'var(--moto-orange)' }} />
              Next Hazard ({hazards[0].distanceKm}km)
            </button>
          )}

          <button
            type="button"
            className="map-btn"
            onClick={() => onFindAlternative && onFindAlternative()}
            title="Query alternative safe bypasses"
          >
            Bypass Ghat Section
          </button>

          {route?.id && (
            <button
              type="button"
              className="map-btn"
              onClick={() => onRouteSelect && onRouteSelect(route.id || '')}
              style={{ display: 'none' }}
            >
              Select Route
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
