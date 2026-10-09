import { Hazard } from './hazard.types';
import { RouteSafetyScore } from './safety-score.types';

export type IntelligenceSourceType =
  | 'osrm'
  | 'open-meteo'
  | 'usgs-earthquake'
  | 'nasa-firms'
  | 'esri-satellite'
  | 'carto-dark'
  | 'community'
  | 'derived'
  | 'demo';

export type FreshnessState =
  | 'live'
  | 'recent'
  | 'cached'
  | 'static-composite'
  | 'demo';

export interface SatelliteStatus {
  imageryProvider: string;
  resolutionMetersPerPx: number;
  captureEpoch: string;
  freshness: FreshnessState;
  cloudCoverPercent: number;
  sensorType: 'Optical Multi-Spectral' | 'Synthetic Aperture Radar (SAR)' | 'Aerial Orthomosaic';
}

export type RoadSurfaceType =
  | 'tarmac-smooth'
  | 'tarmac-patchy'
  | 'gravel-broken'
  | 'ghat-pass';

export interface RouteSegment {
  id: string;
  segmentIndex: number;
  originName: string;
  destinationName: string;
  distanceKm: number;
  durationMinutes: number;
  coordinates: [number, number][]; // [longitude, latitude] array
  surfaceType: RoadSurfaceType;
  elevationGainM: number;
  hazards: Hazard[];
}

export interface AlternateRoute {
  id: string;
  name: string;
  via: string;
  distanceKm: number;
  durationMinutes: number;
  distanceDeltaKm: number;
  durationDeltaMinutes: number;
  safetyScore: number;
  safetyScoreDelta: number;
  coordinates: [number, number][]; // [longitude, latitude]
  advantage: string;
  tradeoff: string;
}

export interface RouteIntelligenceMetadata {
  source: IntelligenceSourceType;
  sourceLabel: string;
  sourceUrl?: string;
  timestamp: number;
  freshness: FreshnessState;
  confidence: number; // 0.0 to 1.0
  isDemoData: boolean;
}

export interface RouteNavigationStep {
  instruction: string;
  distanceM?: number;
  durationS?: number;
  maneuver?: string;
  bearing?: number;
  location?: [number, number];
  roadName?: string;
}

export interface RouteIntelligence {
  routeId: string;
  routeName: string;
  origin: string;
  destination: string;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  totalElevationGainM: number;
  maxElevationM: number;
  routePolyline: [number, number][]; // [longitude, latitude] GeoJSON polyline
  segments: RouteSegment[];
  hazards: Hazard[];
  safetyScore: RouteSafetyScore;
  alternateRoute?: AlternateRoute;
  satelliteStatus: SatelliteStatus;
  metadata: RouteIntelligenceMetadata;
  steps?: RouteNavigationStep[];
}
