import { IntelligenceSourceType, FreshnessState } from './route-intelligence.types';

export type HazardSeverity = 'low' | 'medium' | 'high' | 'critical';

export type HazardCategory =
  | 'road-damage'
  | 'flood-waterlogging'
  | 'landslide-rockfall'
  | 'accident-incident'
  | 'weather-hazard'
  | 'terrain-route-complexity'
  | 'public-source-hazard';

export interface OSINTObservation {
  source: IntelligenceSourceType;
  sourceLabel: string;
  sourceUrl?: string;
  timestamp: number;
  freshness: FreshnessState;
  confidence: number; // 0.0 to 1.0
  isDemoData: boolean;
}

export interface Hazard extends OSINTObservation {
  id: string;
  category: HazardCategory;
  title: string;
  description: string;
  severity: HazardSeverity;
  coordinates: [number, number]; // [longitude, latitude]
  corridorDistanceKm: number;
  locationName: string;
  recommendedAction: string;
  verificationCount: number;
}
