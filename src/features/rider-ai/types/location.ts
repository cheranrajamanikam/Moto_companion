/**
 * Current physical location context.
 * Strict Honesty Rule: Clearly flags whether live GPS hardware is connected or if this is estimated/demo.
 */
export interface LocationContext {
  isLiveGPS: boolean;
  latitude?: number;
  longitude?: number;
  currentRoad?: string;
  nearestTown?: string;
  headingDegrees?: number;
  altitudeM?: number;
  lastUpdatedTimestamp?: number;
}
