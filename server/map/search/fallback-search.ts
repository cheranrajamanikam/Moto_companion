import { Coordinates } from '../routing/routing.interface';
import {
  IReverseGeocodeProvider,
  ISearchProvider,
  NormalizedPlace,
  SearchOptions,
} from './search.interface';

const PRESET_PLACES: NormalizedPlace[] = [
  {
    id: 'place-blr',
    name: 'Bengaluru',
    displayName: 'Bengaluru, Karnataka, India',
    category: 'place',
    type: 'city',
    coordinates: [77.5946, 12.9716],
    locality: 'Bengaluru Urban, Karnataka',
    address: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    boundingBox: [12.834, 13.143, 77.461, 77.752],
    isAdministrativeBoundary: false,
    provenance: {
      source: 'MotoCompanion Curated Directory',
      timestamp: new Date().toISOString(),
      freshness: 'demo',
      confidence: 1.0,
      isDemoData: true,
    },
  },
  {
    id: 'place-nelamangala',
    name: 'Nelamangala Toll Plaza',
    displayName: 'Nelamangala, NH75, Karnataka, India',
    category: 'highway',
    type: 'toll_gantry',
    coordinates: [77.4987, 13.0982],
    locality: 'Nelamangala, Karnataka',
    address: { town: 'Nelamangala', road: 'NH75', state: 'Karnataka', country: 'India' },
    boundingBox: [13.072, 13.124, 77.362, 77.425],
    isAdministrativeBoundary: false,
    provenance: {
      source: 'MotoCompanion Curated Directory',
      timestamp: new Date().toISOString(),
      freshness: 'demo',
      confidence: 1.0,
      isDemoData: true,
    },
  },
  {
    id: 'place-kunigal',
    name: 'Kunigal Bypass',
    displayName: 'Kunigal, Tumakuru District, Karnataka, India',
    category: 'place',
    type: 'town',
    coordinates: [77.2401, 13.0245],
    locality: 'Kunigal, Karnataka',
    address: { town: 'Kunigal', road: 'NH75', state: 'Karnataka', country: 'India' },
    boundingBox: [13.002, 13.048, 77.012, 77.058],
    isAdministrativeBoundary: false,
    provenance: {
      source: 'MotoCompanion Curated Directory',
      timestamp: new Date().toISOString(),
      freshness: 'demo',
      confidence: 1.0,
      isDemoData: true,
    },
  },
  {
    id: 'place-bellur-cross',
    name: 'Bellur Cross',
    displayName: 'Bellur Cross, Mandya District, Karnataka, India',
    category: 'highway',
    type: 'junction',
    coordinates: [76.8402, 12.9812],
    locality: 'Bellur Cross, Karnataka',
    address: { road: 'NH75', state: 'Karnataka', country: 'India' },
    boundingBox: [12.962, 13.001, 76.821, 76.862],
    isAdministrativeBoundary: false,
    provenance: {
      source: 'MotoCompanion Curated Directory',
      timestamp: new Date().toISOString(),
      freshness: 'demo',
      confidence: 1.0,
      isDemoData: true,
    },
  },
  {
    id: 'place-hassan',
    name: 'Hassan Bypass',
    displayName: 'Hassan, Karnataka, India',
    category: 'place',
    type: 'city',
    coordinates: [76.1023, 13.0068],
    locality: 'Hassan, Karnataka',
    address: { city: 'Hassan', state: 'Karnataka', country: 'India' },
    boundingBox: [12.975, 13.042, 76.068, 76.145],
    isAdministrativeBoundary: false,
    provenance: {
      source: 'MotoCompanion Curated Directory',
      timestamp: new Date().toISOString(),
      freshness: 'demo',
      confidence: 1.0,
      isDemoData: true,
    },
  },
  {
    id: 'place-belur',
    name: 'Belur',
    displayName: 'Belur, Hassan District, Karnataka, India',
    category: 'place',
    type: 'town',
    coordinates: [75.8614, 13.1623],
    locality: 'Belur, Karnataka',
    address: { town: 'Belur', state: 'Karnataka', country: 'India' },
    boundingBox: [13.142, 13.185, 75.838, 75.882],
    isAdministrativeBoundary: false,
    provenance: {
      source: 'MotoCompanion Curated Directory',
      timestamp: new Date().toISOString(),
      freshness: 'demo',
      confidence: 1.0,
      isDemoData: true,
    },
  },
  {
    id: 'place-mudigere',
    name: 'Mudigere Ghat Approach',
    displayName: 'Mudigere, Chikmagalur District, Karnataka, India',
    category: 'place',
    type: 'town',
    coordinates: [75.7765, 13.2189],
    locality: 'Mudigere, Karnataka',
    address: { town: 'Mudigere', state: 'Karnataka', country: 'India' },
    boundingBox: [13.118, 13.158, 75.612, 75.665],
    isAdministrativeBoundary: false,
    provenance: {
      source: 'MotoCompanion Curated Directory',
      timestamp: new Date().toISOString(),
      freshness: 'demo',
      confidence: 1.0,
      isDemoData: true,
    },
  },
  {
    id: 'place-ckm',
    name: 'Chikmagalur',
    displayName: 'Chikmagalur Town Center, Karnataka, India',
    category: 'place',
    type: 'city',
    coordinates: [75.7721, 13.3161],
    locality: 'Chikmagalur, Karnataka',
    address: { city: 'Chikmagalur', state: 'Karnataka', country: 'India' },
    boundingBox: [13.285, 13.352, 75.735, 75.815],
    isAdministrativeBoundary: false,
    provenance: {
      source: 'MotoCompanion Curated Directory',
      timestamp: new Date().toISOString(),
      freshness: 'demo',
      confidence: 1.0,
      isDemoData: true,
    },
  },
  {
    id: 'place-sakleshpur',
    name: 'Sakleshpur',
    displayName: 'Sakleshpur, Hassan District, Karnataka, India',
    category: 'place',
    type: 'town',
    coordinates: [75.7865, 12.9442],
    locality: 'Sakleshpur, Karnataka',
    address: { town: 'Sakleshpur', state: 'Karnataka', country: 'India' },
    boundingBox: [12.921, 12.968, 75.761, 75.812],
    isAdministrativeBoundary: false,
    provenance: {
      source: 'MotoCompanion Curated Directory',
      timestamp: new Date().toISOString(),
      freshness: 'demo',
      confidence: 1.0,
      isDemoData: true,
    },
  },
  {
    id: 'place-mysore',
    name: 'Mysore',
    displayName: 'Mysuru (Mysore), Karnataka, India',
    category: 'place',
    type: 'city',
    coordinates: [76.6548, 12.3051],
    locality: 'Mysuru, Karnataka',
    address: { city: 'Mysuru', state: 'Karnataka', country: 'India' },
    boundingBox: [12.261, 12.368, 76.598, 76.712],
    isAdministrativeBoundary: false,
    provenance: {
      source: 'MotoCompanion Curated Directory',
      timestamp: new Date().toISOString(),
      freshness: 'demo',
      confidence: 1.0,
      isDemoData: true,
    },
  },
];

export class FallbackSearchAdapter implements ISearchProvider, IReverseGeocodeProvider {
  async search(options: SearchOptions): Promise<NormalizedPlace[]> {
    const q = options.query.trim().toLowerCase();
    if (!q) return [];

    const matches = PRESET_PLACES.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.displayName.toLowerCase().includes(q) ||
        (p.locality && p.locality.toLowerCase().includes(q))
    );

    matches.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      if (aName === q && bName !== q) return -1;
      if (bName === q && aName !== q) return 1;
      if (aName.startsWith(q) && !bName.startsWith(q)) return -1;
      if (bName.startsWith(q) && !aName.startsWith(q)) return 1;
      return 0;
    });

    return matches.slice(0, options.limit || 5);
  }

  async reverseGeocode(coordinates: Coordinates): Promise<NormalizedPlace | null> {
    const [lon, lat] = coordinates;
    let closest: NormalizedPlace | null = null;
    let minDistance = Infinity;

    for (const place of PRESET_PLACES) {
      const dLon = place.coordinates[0] - lon;
      const dLat = place.coordinates[1] - lat;
      const dist = Math.sqrt(dLon * dLon + dLat * dLat);
      if (dist < minDistance) {
        minDistance = dist;
        closest = place;
      }
    }

    if (!closest) {
      return {
        id: `rev-${Date.now()}`,
        name: `Location at ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        displayName: `Coordinates [${lat.toFixed(4)}, ${lon.toFixed(4)}]`,
        category: 'geographic',
        type: 'coordinate',
        coordinates,
        locality: 'Western Ghats Corridor, Karnataka',
        provenance: {
          source: 'MotoCompanion Coordinate Resolver',
          timestamp: new Date().toISOString(),
          freshness: 'demo',
          confidence: 0.8,
          isDemoData: true,
        },
      };
    }

    return {
      ...closest,
      id: `rev-${closest.id}`,
      displayName: `Near ${closest.displayName}`,
      coordinates,
    };
  }
}

export const fallbackSearchAdapter = new FallbackSearchAdapter();
