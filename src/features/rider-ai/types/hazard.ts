export type HazardSeverity = 'low' | 'medium' | 'high';

export type HazardCategory =
  | 'speed-breaker'
  | 'gravel-patch'
  | 'pothole-cluster'
  | 'diesel-spill'
  | 'blind-crest'
  | 'wildlife-crossing'
  | 'fog-low-visibility'
  | 'landslide-debris'
  | 'water-logging'
  | 'construction';

/**
 * Route hazard information reported by community riders or satellite models.
 */
export interface HazardContext {
  id: string;
  type: string;
  category?: HazardCategory;
  severity: HazardSeverity;
  distanceKm?: number;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  description?: string;
  recommendation?: string;
  verifiedCount?: number;
  reportedAgo?: string;
}
