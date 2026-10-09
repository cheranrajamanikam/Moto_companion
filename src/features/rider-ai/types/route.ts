export type RouteDifficulty = 'easy' | 'moderate' | 'hard';

export type RoadSurfaceQuality = 'smooth' | 'moderate' | 'patchy' | 'rough' | 'under-construction';

/**
 * Metadata and analysis metrics for the current planned or active route.
 * In production, this will be populated from Member 1's route/mapping system.
 */
export interface RouteContext {
  id?: string;
  name?: string;
  origin?: string;
  destination?: string;
  distanceKm?: number;
  durationMinutes?: number;
  difficulty?: RouteDifficulty;
  elevationGainM?: number;
  safetyScore?: number; // 0 - 100
  sharpTurns?: number;
  roadCondition?: RoadSurfaceQuality;
  roadConditionDescription?: string;
  ghatPasses?: string[];
  recommendedDepartureWindow?: string;
}
