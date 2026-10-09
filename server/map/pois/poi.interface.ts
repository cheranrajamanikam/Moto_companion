import { Coordinates, DataProvenance } from '../routing/routing.interface';

export type POICategory =
  | 'fuel'
  | 'repair'
  | 'food'
  | 'stay'
  | 'medical'
  | 'atm'
  | 'police';

export type FuelGradeVerification =
  | 'E20 VERIFIED'
  | '100% PETROL / E0 VERIFIED'
  | 'OTHER GRADE'
  | 'FUEL TYPE NOT VERIFIED';

export interface RoutePOI {
  id: string;
  name: string;
  category: POICategory;
  coordinates: Coordinates; // [lon, lat]
  corridorDistanceKm?: number;
  detourDistanceKm?: number; // Demo/illustrative detour distance
  distanceFromCenterlineKm?: number; // Illustrative distance from route centerline
  fuelGrade?: FuelGradeVerification;
  phone?: string;
  services?: string[]; // Strictly factual source-provided capabilities only
  address?: string;
  locationName?: string;
  provenance: DataProvenance;
}

export interface POISearchParams {
  bbox?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  corridorKey?: string;
  categories?: POICategory[];
}

export interface IPOIProvider {
  getPOIsInBBox(params: POISearchParams): Promise<RoutePOI[]>;
}
