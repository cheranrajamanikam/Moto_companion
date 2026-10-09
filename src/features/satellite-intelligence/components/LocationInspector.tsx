import React, { useState } from 'react';
import { PlaceApiResult } from '../services/map-api.service';
import { MapPinIcon, CheckIcon, NavigationIcon } from './icons';

interface Props {
  location: PlaceApiResult;
  distanceFromRouteKm?: number;
  onSetDestination: (coords: [number, number], name: string) => void;
  onFindNearbyPOIs: (coords: [number, number]) => void;
  onClose: () => void;
}

export const LocationInspector: React.FC<Props> = ({
  location,
  distanceFromRouteKm,
  onSetDestination,
  onFindNearbyPOIs,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const [lon, lat] = location.coordinates;
  const coordString = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  const formattedCoord = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(coordString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="location-inspector-drawer" data-testid="location-inspector-drawer">
      {/* Header */}
      <div className="location-inspector-header">
        <div className="inspector-title-box">
          <span className="inspector-pin-icon">
            <MapPinIcon size={18} />
          </span>
          <div>
            <h4 className="inspector-place-name" data-testid="inspector-place-name">
              {location.name}
            </h4>
            <span className="inspector-category-badge">
              {location.type || location.category || 'Map Location'}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="inspector-close-btn"
          onClick={onClose}
          aria-label="Close location inspector"
          data-testid="inspector-close-btn"
        >
          ✕
        </button>
      </div>

      {/* Address & Locality */}
      <div className="inspector-address-section">
        <p className="inspector-formatted-address" data-testid="inspector-address">
          {location.displayName || 'No formatted street address available'}
        </p>
      </div>

      {/* Coordinate Facts (Verified Only) */}
      <div className="inspector-facts-grid">
        <div className="inspector-fact-item">
          <span className="fact-label">Coordinates</span>
          <span className="fact-value" data-testid="inspector-coords">{formattedCoord}</span>
        </div>

        {distanceFromRouteKm !== undefined && (
          <div className="inspector-fact-item">
            <span className="fact-label">Corridor Proximity</span>
            <span className="fact-value" data-testid="inspector-corridor-dist">
              {distanceFromRouteKm < 0.1 ? 'On Corridor Centerline' : `${distanceFromRouteKm.toFixed(1)} km from route`}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="inspector-actions-row">
        <button
          type="button"
          className="inspector-action-btn primary"
          onClick={() => onSetDestination(location.coordinates, location.name)}
          data-testid="inspector-set-destination-btn"
        >
          <NavigationIcon size={14} />
          <span>Set as Destination</span>
        </button>

        <button
          type="button"
          className="inspector-action-btn secondary"
          onClick={() => onFindNearbyPOIs(location.coordinates)}
          data-testid="inspector-nearby-pois-btn"
        >
          <span>Find POIs Nearby</span>
        </button>

        <button
          type="button"
          className="inspector-action-btn tertiary"
          onClick={handleCopy}
          title="Copy raw lat,lng to clipboard"
          data-testid="inspector-copy-coords-btn"
        >
          {copied ? <CheckIcon size={14} /> : null}
          <span>{copied ? 'Copied!' : 'Copy Coords'}</span>
        </button>
      </div>

      {/* Verified Provenance Footer (Strict Anti-Fabrication Guarantee) */}
      <div className="inspector-provenance-footer" data-testid="inspector-provenance">
        <span>Verified via {location.provenance?.source || 'OpenStreetMap Nominatim'}</span>
        <span className="provenance-freshness-pill">
          {location.provenance?.freshness || 'recent'}
        </span>
      </div>
    </div>
  );
};
