import React from 'react';
import { RoutePOI, POICategory } from '../types/poi.types';
import {
  FuelIcon,
  WrenchIcon,
  UtensilsIcon,
  BedIcon,
  CrossIcon,
  CreditCardIcon,
  ShieldIcon,
} from './icons';

interface Props {
  pois: RoutePOI[];
  selectedCategory: POICategory | 'all';
  onSelectCategory: (cat: POICategory | 'all') => void;
  selectedPOIId?: string | null;
  onSelectPOI: (poi: RoutePOI) => void;
}

const CATEGORY_CHIPS: Array<{ key: POICategory; label: string; icon: React.ReactNode }> = [
  { key: 'fuel', label: 'Fuel', icon: <FuelIcon size={12} /> },
  { key: 'repair', label: 'Repair', icon: <WrenchIcon size={12} /> },
  { key: 'food', label: 'Food', icon: <UtensilsIcon size={12} /> },
  { key: 'stay', label: 'Stay', icon: <BedIcon size={12} /> },
  { key: 'medical', label: 'Medical', icon: <CrossIcon size={12} /> },
  { key: 'atm', label: 'ATM', icon: <CreditCardIcon size={12} /> },
  { key: 'police', label: 'Police', icon: <ShieldIcon size={12} /> },
];

export const NearRoutePOIPanel: React.FC<Props> = ({
  pois,
  selectedCategory,
  onSelectCategory,
  selectedPOIId,
  onSelectPOI,
}) => {
  const filteredPOIs =
    selectedCategory === 'all'
      ? pois
      : pois.filter((p) => p.category === selectedCategory);

  return (
    <section className="near-route-section" aria-label="Near My Route Rider Services">
      <div className="near-route-header">
        <div>
          <h3 className="near-route-title">NEAR MY ROUTE</h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--moto-text-secondary)' }}>
            What are you looking for?
          </span>
        </div>
        <span className="demo-data-badge" title="Illustrative demo fixtures for trip simulation">
          DEMO DATA
        </span>
      </div>

      {/* 7 Category Filter Chips */}
      <div className="poi-categories-chips" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={selectedCategory === 'all'}
          className={`poi-chip-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => onSelectCategory('all')}
        >
          <span>All ({pois.length})</span>
        </button>

        {CATEGORY_CHIPS.map((chip) => {
          const count = pois.filter((p) => p.category === chip.key).length;
          return (
            <button
              key={chip.key}
              type="button"
              role="tab"
              aria-selected={selectedCategory === chip.key}
              className={`poi-chip-btn ${selectedCategory === chip.key ? 'active' : ''}`}
              onClick={() => onSelectCategory(chip.key)}
            >
              {chip.icon}
              <span>{chip.label}</span>
              {count > 0 && <span style={{ opacity: 0.65, fontSize: '0.68rem' }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Route-Aware POI List */}
      <div className="poi-cards-list">
        {filteredPOIs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--moto-text-muted)', fontSize: '0.78rem' }}>
            No services listed in this category along the immediate corridor.
          </div>
        ) : (
          filteredPOIs.map((poi) => {
            const isSelected = selectedPOIId === poi.id;
            return (
              <div
                key={poi.id}
                className={`poi-card-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectPOI(poi)}
                style={isSelected ? { borderColor: 'var(--moto-orange)', background: 'rgba(249, 115, 22, 0.08)' } : undefined}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectPOI(poi)}
              >
                <div className="poi-card-header">
                  <span className="poi-card-name">{poi.name}</span>
                  <span className="poi-card-dist">
                    {poi.distanceFromOriginKm > 0 ? `${poi.distanceFromOriginKm} km ahead` : 'Near origin'}
                  </span>
                </div>

                <div className="poi-card-meta">
                  <span>+{poi.detourDistanceKm} km detour</span>
                  <span>•</span>
                  <span>{poi.distanceFromRouteKm} km off corridor</span>
                </div>

                {poi.category === 'fuel' && poi.fuelGradeStatus && (
                  <div style={{ marginTop: 2 }}>
                    <span
                      className={`fuel-status-tag ${
                        poi.fuelGradeStatus.includes('VERIFIED') && !poi.fuelGradeStatus.includes('NOT')
                          ? 'verified'
                          : 'unverified'
                      }`}
                    >
                      {poi.fuelGradeStatus}
                    </span>
                  </div>
                )}

                {poi.category === 'repair' && poi.serviceType && (
                  <div style={{ fontSize: '0.68rem', color: '#93c5fd', marginTop: 2 }}>
                    🔧 {poi.serviceType}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
