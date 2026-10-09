import { FreshnessState } from './route-intelligence.types';

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
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
  /**
   * Illustrative distance in kilometers from the route centerline.
   */
  distanceFromRouteKm: number;
  /**
   * Demo detour distance in kilometers required to reach the POI from the highway.
   */
  detourDistanceKm: number;
  /**
   * Illustrative cumulative corridor distance from route origin in kilometers.
   */
  distanceFromOriginKm: number;
  /**
   * True if the POI is situated forward along the travel direction from current position.
   */
  isAheadOnRoute: boolean;
  /**
   * Verified fuel status representation. Default: 'FUEL TYPE NOT VERIFIED'.
   * Never inferred from brand names or logos.
   */
  fuelGradeStatus?: FuelGradeVerification;
  /**
   * Motorcycle-specific service description for repair category (e.g. 'Tyre puncture & tubeless repair').
   */
  serviceType?: string;
  source: string;
  sourceUrl?: string;
  timestamp: number;
  freshness: FreshnessState;
  isDemoData: boolean;
}
