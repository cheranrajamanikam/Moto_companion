export type Coordinates = [number, number]; // [lon, lat]

export type DataFreshnessState = 'live/current' | 'recent' | 'cached' | 'demo';

export interface DataProvenance {
  source: string;
  sourceUrl?: string;
  timestamp: string; // ISO8601
  freshness: DataFreshnessState;
  confidence?: number;
  isDemoData: boolean;
}

export type ManeuverType =
  | 'depart'
  | 'arrive'
  | 'turn-left'
  | 'turn-right'
  | 'turn-slight-left'
  | 'turn-slight-right'
  | 'turn-sharp-left'
  | 'turn-sharp-right'
  | 'continue'
  | 'fork'
  | 'roundabout'
  | 'merge';

export interface NormalizedRouteStep {
  instruction: string;
  distanceM: number;
  durationS: number;
  maneuver: ManeuverType;
  bearing: number;
  location: Coordinates;
  roadName?: string;
}

export interface NormalizedRoute {
  id: string;
  name: string;
  originName: string;
  destinationName: string;
  coordinates: Coordinates[]; // High-resolution polyline
  distanceKm: number;
  durationMinutes: number;
  elevationGainM: number;
  steps: NormalizedRouteStep[];
  alternates?: NormalizedRoute[];
  provenance: DataProvenance;
}

export interface RouteRequestParams {
  origin: Coordinates;
  destination: Coordinates;
  originName?: string;
  destinationName?: string;
  alternatives?: boolean;
}

export interface IRoutingProvider {
  calculateRoute(params: RouteRequestParams): Promise<NormalizedRoute>;
}
