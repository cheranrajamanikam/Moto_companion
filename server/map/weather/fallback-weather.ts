import {
  IWeatherProvider,
  RouteWeatherSummary,
  WeatherCheckpointRequest,
} from './weather.interface';

export class FallbackWeatherAdapter implements IWeatherProvider {
  async getWeatherForCheckpoints(points: WeatherCheckpointRequest[]): Promise<RouteWeatherSummary> {
    const checkpoints = (points.length > 0
      ? points
      : [
          { name: 'Nelamangala Plains', coordinates: [77.4987, 13.0982] as [number, number] },
          { name: 'Kunigal Midpoint', coordinates: [77.2401, 13.0245] as [number, number] },
          { name: 'Hassan Plateau', coordinates: [76.1023, 13.0068] as [number, number] },
          { name: 'Mudigere Ghat Summit', coordinates: [75.7765, 13.2189] as [number, number] },
        ]
    ).map((pt, idx) => ({
      locationName: pt.name,
      coordinates: pt.coordinates,
      temperatureC: 24 - idx * 2,
      rainProbabilityPercent: idx >= 2 ? 35 : 10,
      weatherCode: idx >= 2 ? 61 : 1, // 61: Slight rain, 1: Mainly clear
      weatherDescription: idx >= 2 ? 'Passing Light Showers' : 'Partly Cloudy',
      windSpeedKmh: 14 + idx,
      visibilityKm: idx >= 3 ? 6.5 : 10.0,
      roadGripRisk: (idx >= 2 ? 'moderate' : 'low') as 'low' | 'moderate' | 'high',
    }));

    return {
      checkpoints,
      maxRainProbability: 35,
      overallCondition: 'Scattered Ghat Showers',
      advisory: 'Dry tarmac across highway NH75; reduced friction expected on Mudigere descending hairpins.',
      provenance: {
        source: 'Open-Meteo Fallback / Curated Meteorological Model',
        sourceUrl: 'https://open-meteo.com',
        timestamp: new Date().toISOString(),
        freshness: 'demo',
        confidence: 0.9,
        isDemoData: true,
      },
    };
  }
}

export const fallbackWeatherAdapter = new FallbackWeatherAdapter();
