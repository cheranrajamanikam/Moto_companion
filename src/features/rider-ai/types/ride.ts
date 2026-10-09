export type RideStatus = 'scheduled' | 'in-progress' | 'paused' | 'completed';

/**
 * High-level ride session status and overview.
 */
export interface RideContext {
  id?: string;
  title?: string;
  origin?: string;
  destination?: string;
  totalDistanceKm?: number;
  estimatedDurationMinutes?: number;
  safetyScore?: number; // 0 - 100
  status?: RideStatus;
  departureTime?: string;
  waypoints?: string[];
  isDemoData: boolean;
}
