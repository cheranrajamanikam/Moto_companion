/**
 * Environmental weather context along the rider's itinerary.
 * Follows strict honesty rules: if unavailable, isAvailable is set to false.
 */
export interface WeatherContext {
  isAvailable: boolean;
  condition?: string;
  temperatureC?: number;
  feelsLikeC?: number;
  rainProbability?: number; // 0 - 100
  windSpeedKmh?: number;
  visibilityKm?: number;
  radarAlert?: string;
  optimalRidingWindow?: string;
}
