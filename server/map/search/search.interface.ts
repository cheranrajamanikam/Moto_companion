import { Coordinates, DataProvenance } from '../routing/routing.interface';

export interface NormalizedPlace {
  id: string;
  name: string;
  displayName: string;
  category: string;
  type: string;
  coordinates: Coordinates; // [lon, lat]
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  locality?: string;
  importance?: number;
  boundingBox?: [number, number, number, number]; // [minLat, maxLat, minLon, maxLon]
  boundaryGeojson?: any; // GeoJSON Polygon or MultiPolygon if provided by provider
  isAdministrativeBoundary?: boolean;
  provenance: DataProvenance;
}

export interface SearchOptions {
  query: string;
  limit?: number;
  viewbox?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
}

export interface ISearchProvider {
  search(options: SearchOptions): Promise<NormalizedPlace[]>;
}

export interface IReverseGeocodeProvider {
  reverseGeocode(coordinates: Coordinates): Promise<NormalizedPlace | null>;
}
