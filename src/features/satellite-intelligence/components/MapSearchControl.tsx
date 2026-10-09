import React, { useState } from 'react';
import { PlaceApiResult, mapApiService } from '../services/map-api.service';
import { SearchIcon } from './icons';

interface Props {
  onSelectPlace: (place: PlaceApiResult) => void;
  onClearSearch?: () => void;
}

const QUICK_CHIPS = [
  'Nelamangala',
  'Kunigal',
  'Hassan',
  'Belur',
  'Mudigere',
  'Chikmagalur',
];

export const MapSearchControl: React.FC<Props> = ({ onSelectPlace, onClearSearch }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<PlaceApiResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Explicit search submission only (Adhering strictly to Nominatim Usage Policy)
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
      console.error('[MapSearchControl] Search failed:', err);
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

  const handleChipClick = (chip: string) => {
    setQuery(chip);
    handleSearch(chip);
  };

  return (
    <div className="map-search-control-container" data-testid="map-search-control">
      {/* Search Input Bar */}
      <div className="map-search-bar">
        <span className="map-search-icon">
          <SearchIcon size={16} />
        </span>
        <input
          type="text"
          className="map-search-input"
          placeholder="Search places or coordinates (Press Enter)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Search places along motorcycle corridors"
          data-testid="map-search-input"
        />
        {query && (
          <button
            type="button"
            className="map-search-clear-btn"
            onClick={handleClear}
            title="Clear search"
            data-testid="map-search-clear-btn"
          >
            ✕
          </button>
        )}
        <button
          type="button"
          className="map-search-submit-btn"
          onClick={() => handleSearch()}
          disabled={isSearching || !query.trim()}
          data-testid="map-search-submit-btn"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Quick Destination Chips */}
      <div className="map-search-chips">
        <span className="search-chips-label">Quick Waypoints:</span>
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            className="search-chip-btn"
            onClick={() => handleChipClick(chip)}
            data-testid={`search-chip-${chip.toLowerCase()}`}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="map-search-dropdown" data-testid="map-search-dropdown">
          <div className="search-dropdown-header">
            <span>Verified Results ({results.length})</span>
            <button
              type="button"
              className="search-dropdown-close"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          {results.length === 0 ? (
            <div className="search-no-results">
              {hasSearched ? `No verified places found for "${query}".` : 'Enter a location name.'}
            </div>
          ) : (
            <ul className="search-results-list">
              {results.map((place) => (
                <li
                  key={place.id}
                  className="search-result-item"
                  onClick={() => handleSelectResult(place)}
                  data-testid={`search-result-${place.id}`}
                >
                  <div className="result-main-line">
                    <span className="result-name">{place.name}</span>
                    <span className="result-category-badge">{place.type || place.category}</span>
                  </div>
                  <div className="result-sub-line">
                    {place.locality || place.displayName}
                  </div>
                  <div className="result-coords">
                    {place.coordinates[1].toFixed(4)}° N, {place.coordinates[0].toFixed(4)}° E
                    <span className="result-provenance">· {place.provenance.source}</span>
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
