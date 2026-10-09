import React, { useState } from 'react';
import { PlaceApiResult, mapApiService } from '../services/map-api.service';
import { SearchIcon } from './icons';

interface Props {
  onSelectPlace: (place: PlaceApiResult) => void;
  onClearSearch?: () => void;
}

export const MapExplorationSearch: React.FC<Props> = ({ onSelectPlace, onClearSearch }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<PlaceApiResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Explicit search submission only (Adheres strictly to Nominatim Usage Policy - zero continuous keystroke queries)
  const handleSearch = async (searchTerm?: string) => {
    const term = (searchTerm !== undefined ? searchTerm : query).trim();
    if (!term) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const places = await mapApiService.searchPlaces(term, 6);
      setResults(places);
      setIsOpen(true);
    } catch (err) {
      console.error('[MapExplorationSearch] Search failed:', err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectResult = (place: PlaceApiResult) => {
    setQuery(place.name);
    setIsOpen(false);
    onSelectPlace(place);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setIsOpen(false);
    if (onClearSearch) onClearSearch();
  };

  return (
    <div className="map-exploration-search-container" data-testid="map-exploration-search">
      {/* Search Input Row */}
      <div className="map-exploration-bar">
        <span className="map-exploration-icon">
          <SearchIcon size={16} />
        </span>
        <input
          type="text"
          className="map-exploration-input"
          placeholder="Search places, towns, roads, or landmarks to explore (Press Enter)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Search places and locations to explore on map"
          data-testid="map-exploration-input"
        />
        {query && (
          <button
            type="button"
            className="map-exploration-clear-btn"
            onClick={handleClear}
            title="Clear search"
            data-testid="map-exploration-clear-btn"
          >
            ✕
          </button>
        )}
        <button
          type="button"
          className="map-exploration-submit-btn"
          onClick={() => handleSearch()}
          disabled={isSearching || !query.trim()}
          data-testid="map-exploration-submit-btn"
        >
          {isSearching ? 'Searching...' : 'Explore Place'}
        </button>
      </div>

      {/* Verified Search Results Dropdown */}
      {isOpen && (
        <div className="map-exploration-dropdown" data-testid="map-exploration-dropdown">
          <div className="exploration-dropdown-header">
            <span>Verified Places ({results.length})</span>
            <button
              type="button"
              className="exploration-dropdown-close"
              onClick={() => setIsOpen(false)}
              data-testid="map-exploration-dropdown-close"
            >
              ✕
            </button>
          </div>

          {results.length === 0 ? (
            <div className="exploration-no-results">
              {hasSearched ? `No verified locations found for "${query}".` : 'Enter a location name.'}
            </div>
          ) : (
            <ul className="exploration-results-list">
              {results.map((place) => (
                <li
                  key={place.id}
                  className="exploration-result-item"
                  onClick={() => handleSelectResult(place)}
                  data-testid={`exploration-result-${place.id}`}
                >
                  <div className="exploration-result-main">
                    <span className="exploration-result-name">{place.name}</span>
                    <span className="exploration-result-badge">{place.type || place.category}</span>
                  </div>
                  <div className="exploration-result-sub">
                    {place.locality || place.displayName}
                  </div>
                  <div className="exploration-result-coords">
                    {place.coordinates[1].toFixed(4)}° N, {place.coordinates[0].toFixed(4)}° E
                    <span className="exploration-result-provenance"> · {place.provenance.source}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
