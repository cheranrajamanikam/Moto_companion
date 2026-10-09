import React from 'react';
import { MapLayerMode } from '../types/map.types';
import { LayersIcon, SatelliteIcon, MountainIcon } from './icons';

interface Props {
  activeMode: MapLayerMode;
  onChangeMode: (mode: MapLayerMode) => void;
}

export const MapLayerControls: React.FC<Props> = ({ activeMode, onChangeMode }) => {
  return (
    <div className="map-view-switcher-pill" data-testid="map-layer-controls" role="toolbar" aria-label="Map Base Layer View Selection">
      <button
        type="button"
        className={`map-mode-btn ${activeMode === 'dark' ? 'active' : ''}`}
        onClick={() => onChangeMode('dark')}
        title="Switch to Default High-Contrast Dark Map"
        aria-pressed={activeMode === 'dark'}
      >
        <LayersIcon size={13} />
        <span>DEFAULT</span>
      </button>

      <button
        type="button"
        className={`map-mode-btn ${activeMode === 'satellite' ? 'active' : ''}`}
        onClick={() => onChangeMode('satellite')}
        title="Switch to Satellite Orbital Imagery"
        aria-pressed={activeMode === 'satellite'}
      >
        <SatelliteIcon size={13} />
        <span>SATELLITE</span>
      </button>

      <button
        type="button"
        className={`map-mode-btn ${activeMode === 'terrain' ? 'active' : ''}`}
        onClick={() => onChangeMode('terrain')}
        title="Switch to Topographical Elevation Terrain Map"
        aria-pressed={activeMode === 'terrain'}
      >
        <MountainIcon size={13} />
        <span>TERRAIN</span>
      </button>
    </div>
  );
};
