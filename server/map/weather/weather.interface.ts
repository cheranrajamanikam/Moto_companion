import { Coordinates, DataProvenance } from '../routing/routing.interface';

export interface RouteWeatherPoint {
  locationName: string;
  coordinates: Coordinates; // [lon, lat]
  temperatureC: number;
  rainProbabilityPercent: number;
  weatherCode: number;
  weatherDescription: string;
  windSpeedKmh: number;
  visibilityKm: number;
  roadGripRisk: 'low' | 'moderate' | 'high';
}

export interface RouteWeatherSummary {
  checkpoints: RouteWeatherPoint[];
  maxRainProbability: number;
  overallCondition: string;
  advisory: string;
  provenance: DataProvenance;
}

export interface WeatherCheckpointRequest {
  name: string;
  coordinates: Coordinates;
}

export interface IWeatherProvider {
  getWeatherForCheckpoints(points: WeatherCheckpointRequest[]): Promise<RouteWeatherSummary>;
}
