import React, { useState, useEffect } from 'react';
import { PlaceApiResult, mapApiService } from '../services/map-api.service';

interface Props {
  originName: string;
  destinationName: string;
  onUpdateOrigin: (name: string, coords?: [number, number]) => void;
  onUpdateDestination: (name: string, coords?: [number, number]) => void;
  onSwapEndpoints: () => void;
  onUseCurrentLocation: () => void;
  onSelectSearchResult: (place: PlaceApiResult) => void;
  stops?: string[];
  onAddStop?: (name: string) => void;
  onRemoveStop?: (index: number) => void;
  onClosePlanning?: () => void;
}

const QUICK_WAYPOINTS: { name: string; coordinates: [number, number] }[] = [
  { name: 'Nelamangala', coordinates: [77.4987, 13.0982] },
  { name: 'Kunigal', coordinates: [77.2401, 13.0245] },
  { name: 'Hassan', coordinates: [76.1023, 13.0068] },
  { name: 'Belur', coordinates: [75.8643, 13.1633] },
  { name: 'Mudigere', coordinates: [75.7765, 13.2189] },
  { name: 'Chikmagalur', coordinates: [75.7738, 13.3161] },
];

export const RoutePlannerHeader: React.FC<Props> = ({
  originName,
  destinationName,
  onUpdateOrigin,
  onUpdateDestination,
  onSwapEndpoints,
  onUseCurrentLocation,
  onSelectSearchResult,
  stops = [],
  onAddStop,
  onRemoveStop,
  onClosePlanning,
}) => {
  const [originInput, setOriginInput] = useState(originName);
  const [destInput, setDestInput] = useState(destinationName);
  const [searchResults, setSearchResults] = useState<PlaceApiResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState<'origin' | 'dest' | null>(null);
  const [newStopInput, setNewStopInput] = useState('');
  const [showStopInput, setShowStopInput] = useState(false);

  useEffect(() => {
    setOriginInput(originName);
  }, [originName]);

  useEffect(() => {
    setDestInput(destinationName);
  }, [destinationName]);

  // Explicit submit search (Enter key or Search button ONLY; zero continuous keystroke queries)
  const handleExplicitSearch = async (query: string, field: 'origin' | 'dest') => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setActiveSearchField(field);
    try {
      const places = await mapApiService.searchPlaces(trimmed);
      setSearchResults(places);
    } catch (err) {
      console.warn('[RoutePlannerHeader] Explicit search failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = (place: PlaceApiResult) => {
    if (activeSearchField === 'origin') {
      setOriginInput(place.name);
      onUpdateOrigin(place.name, place.coordinates);
    } else {
      setDestInput(place.name);
      onUpdateDestination(place.name, place.coordinates);
      onSelectSearchResult(place);
    }
    setSearchResults([]);
    setActiveSearchField(null);
  };

  const handleQuickWaypointClick = (wp: { name: string; coordinates: [number, number] }) => {
    setDestInput(wp.name);
    onUpdateDestination(wp.name, wp.coordinates);
    onSelectSearchResult({
      id: `wp-${wp.name.toLowerCase()}`,
      name: wp.name,
      displayName: `${wp.name}, Karnataka, India`,
      category: 'waypoint',
      type: 'place',
      coordinates: wp.coordinates,
      provenance: {
        source: 'MotoCompanion Curated Waypoint',
        timestamp: new Date().toISOString(),
        freshness: 'recent',
        isDemoData: false,
      },
    });
  };

  return (
    <div className="route-planner-header-container" data-testid="route-planner-header">
      {/* Top Title Bar */}
      <div className="planner-top-bar">
        {onClosePlanning && (
          <button
            type="button"
            className="planner-back-btn"
            onClick={onClosePlanning}
            title="Return to map exploration"
            data-testid="planner-back-btn"
          >
            ←
          </button>
        )}
        <span className="planner-title">Plan Motorcycle Route</span>
      </div>

      {/* Main Dual-Input Route Planner Card with Structured Non-Overlapping Layout */}
      <div className="planner-card">
        {/* Origin Row */}
        <div className="planner-field-row origin-row">
          <div className="field-indicator origin-indicator" title="Origin">
            🟢
          </div>
          <input
            type="text"
            className="planner-input origin"
            value={originInput}
            onChange={(e) => setOriginInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleExplicitSearch(originInput, 'origin');
            }}
            placeholder="Your location / Starting point"
            data-testid="origin-input"
          />
          <button
            type="button"
            className="planner-gps-chip-btn"
            onClick={onUseCurrentLocation}
            title="Use current GPS location as starting point"
            data-testid="use-current-location-btn"
          >
            📍 GPS
          </button>
        </div>

        {/* Connection Indicator & Swap Row */}
        <div className="planner-connector-row">
          <div className="connector-trajectory">
            <span className="connector-line"></span>
            <span className="connector-arrow">↓</span>
          </div>
          <button
            type="button"
            className="planner-swap-btn"
            onClick={() => {
              const temp = originInput;
              setOriginInput(destInput);
              setDestInput(temp);
              onSwapEndpoints();
            }}
            title="Swap Origin and Destination"
            data-testid="swap-endpoints-btn"
          >
            <span className="swap-icon">⇅</span>
            <span className="swap-label">Swap</span>
          </button>
        </div>

        {/* Destination Row */}
        <div className="planner-field-row destination-row">
          <div className="field-indicator destination-indicator" title="Destination">
            🟠
          </div>
          <input
            type="text"
            className="planner-input destination"
            value={destInput}
            onChange={(e) => setDestInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleExplicitSearch(destInput, 'dest');
            }}
            placeholder="Choose destination..."
            data-testid="destination-input"
          />
        </div>

        {/* Planner Action Buttons Bar */}
        <div className="planner-actions-bar">
          <button
            type="button"
            className="planner-search-submit-btn"
            onClick={() => handleExplicitSearch(destInput || originInput, 'dest')}
            title="Explicit Search via Nominatim"
            data-testid="search-destination-btn"
          >
            🔍 Search Route
          </button>

          {onAddStop && (
            <button
              type="button"
              className="planner-add-stop-btn"
              onClick={() => setShowStopInput((prev) => !prev)}
              data-testid="show-add-stop-input-btn"
            >
              ➕ Add intermediate stop
            </button>
          )}
        </div>

        {/* Interactive Add Stop Inline Box */}
        {showStopInput && onAddStop && (
          <div className="add-stop-input-box" data-testid="add-stop-input-box">
            <input
              type="text"
              className="add-stop-field"
              value={newStopInput}
              onChange={(e) => setNewStopInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newStopInput.trim()) {
                  onAddStop(newStopInput.trim());
                  setNewStopInput('');
                  setShowStopInput(false);
                }
              }}
              placeholder="Enter waypoint / town name..."
              autoFocus
            />
            <button
              type="button"
              className="add-stop-confirm-btn"
              onClick={() => {
                if (newStopInput.trim()) {
                  onAddStop(newStopInput.trim());
                  setNewStopInput('');
                  setShowStopInput(false);
                }
              }}
            >
              Add
            </button>
            <button
              type="button"
              className="add-stop-cancel-btn"
              onClick={() => setShowStopInput(false)}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Intermediate Stops List */}
        {stops.length > 0 && (
          <div className="planner-stops-list" data-testid="planner-stops-list">
            {stops.map((stop, idx) => (
              <div key={idx} className="planner-stop-row" data-testid={`planner-stop-${idx}`}>
                <span className="stop-marker">⚪</span>
                <span className="stop-name">{stop}</span>
                {onRemoveStop && (
                  <button
                    type="button"
                    className="remove-stop-btn"
                    onClick={() => onRemoveStop(idx)}
                    title="Remove stop"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick Waypoints Row */}
        <div className="planner-quick-waypoints-section" data-testid="quick-waypoints-section">
          <span className="quick-waypoints-label">Quick Waypoints:</span>
          <div className="quick-waypoints-chips">
            {QUICK_WAYPOINTS.map((wp) => (
              <button
                key={wp.name}
                type="button"
                className={`quick-waypoint-chip ${destInput === wp.name ? 'active' : ''}`}
                onClick={() => handleQuickWaypointClick(wp)}
                title={`Set destination to ${wp.name}`}
                data-testid={`quick-waypoint-${wp.name.toLowerCase()}`}
              >
                {wp.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Explicit Search Results Dropdown Overlay */}
      {isSearching && (
        <div className="planner-search-loading">Searching places via Nominatim...</div>
      )}
      {searchResults.length > 0 && (
        <div className="planner-search-results-dropdown" data-testid="planner-search-results">
          <div className="search-results-header">
            <span>Select Matching Location</span>
            <button type="button" onClick={() => setSearchResults([])}>✕</button>
          </div>
          {searchResults.map((place) => (
            <button
              key={place.id}
              type="button"
              className="search-result-item-row"
              onClick={() => handleSelectPlace(place)}
              data-testid={`search-result-${place.id}`}
            >
              <span className="result-pin">📍</span>
              <div className="result-text-block">
                <span className="result-title">{place.name}</span>
                <span className="result-subtitle">{place.displayName}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
