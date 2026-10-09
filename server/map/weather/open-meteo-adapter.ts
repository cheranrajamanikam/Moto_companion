import {
  IWeatherProvider,
  RouteWeatherPoint,
  RouteWeatherSummary,
  WeatherCheckpointRequest,
} from './weather.interface';
import { fallbackWeatherAdapter } from './fallback-weather';
import { globalMemoryCache } from '../cache/memory-cache';
import { providerLimiters } from '../rate-limit/token-bucket';

function decodeWMOCode(code: number): { description: string; gripRisk: 'low' | 'moderate' | 'high' } {
  if (code === 0) return { description: 'Clear Sky', gripRisk: 'low' };
  if (code === 1 || code === 2) return { description: 'Partly Cloudy', gripRisk: 'low' };
  if (code === 3) return { description: 'Overcast', gripRisk: 'low' };
  if (code >= 45 && code <= 48) return { description: 'Dense Fog / Reduced Visibility', gripRisk: 'moderate' };
  if (code >= 51 && code <= 55) return { description: 'Light Drizzle', gripRisk: 'moderate' };
  if (code >= 61 && code <= 65) return { description: 'Rain Showers', gripRisk: 'high' };
  if (code >= 80 && code <= 82) return { description: 'Violent Rain Squalls', gripRisk: 'high' };
  if (code >= 95) return { description: 'Thunderstorm with Gusty Winds', gripRisk: 'high' };
  return { description: 'Scattered Clouds', gripRisk: 'low' };
}

export class OpenMeteoWeatherAdapter implements IWeatherProvider {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(
    baseUrl = 'https://api.open-meteo.com/v1/forecast',
    timeoutMs = 4500
  ) {
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  async getWeatherForCheckpoints(points: WeatherCheckpointRequest[]): Promise<RouteWeatherSummary> {
    const list = points.length > 0 ? points : [
      { name: 'Nelamangala Plains', coordinates: [77.4987, 13.0982] as [number, number] },
      { name: 'Kunigal Midpoint', coordinates: [77.2401, 13.0245] as [number, number] },
      { name: 'Hassan Plateau', coordinates: [76.1023, 13.0068] as [number, number] },
      { name: 'Mudigere Ghat Summit', coordinates: [75.7765, 13.2189] as [number, number] },
    ];

    const cacheKey = `weather:openmeteo:${list.map((p) => `${p.coordinates[0].toFixed(2)},${p.coordinates[1].toFixed(2)}`).join(';')}`;

    return globalMemoryCache.fetchOrDedupe<RouteWeatherSummary>(
      cacheKey,
      15 * 60 * 1000, // 15 minutes TTL
      async () => {
        const allowed = await providerLimiters.openMeteo.acquire(1, 2000);
        if (!allowed) {
          console.warn('[OpenMeteoWeatherAdapter] Rate limit exceeded, using fallback weather');
          return fallbackWeatherAdapter.getWeatherForCheckpoints(list);
        }

        try {
          const lats = list.map((p) => p.coordinates[1]).join(',');
          const lons = list.map((p) => p.coordinates[0]).join(',');

          const url = `${this.baseUrl}?latitude=${lats}&longitude=${lons}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_hours=6`;

          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), this.timeoutMs);

          const response = await fetch(url, {
            headers: {
              'User-Agent': 'MotoCompanion-Navigation-Platform/1.0',
              Accept: 'application/json',
            },
            signal: controller.signal,
          });

          clearTimeout(timer);

          if (!response.ok) {
            console.warn(`[OpenMeteoWeatherAdapter] HTTP ${response.status} from Open-Meteo, using fallback weather`);
            return fallbackWeatherAdapter.getWeatherForCheckpoints(list);
          }

          const raw = await response.json();
          const resultsArray = Array.isArray(raw) ? raw : [raw];

          let maxRain = 0;
          const checkpoints: RouteWeatherPoint[] = resultsArray.map((res: any, idx: number) => {
            const ptInfo = list[idx] || list[0];
            const current = res.current || {};
            const hourly = res.hourly || {};
            const rainProb = hourly.precipitation_probability?.[0] ?? (current.precipitation > 0 ? 80 : 15);
            if (rainProb > maxRain) maxRain = rainProb;

            const decoded = decodeWMOCode(current.weather_code ?? 0);

            return {
              locationName: ptInfo.name,
              coordinates: ptInfo.coordinates,
              temperatureC: Math.round(current.temperature_2m ?? 24),
              rainProbabilityPercent: rainProb,
              weatherCode: current.weather_code ?? 0,
              weatherDescription: decoded.description,
              windSpeedKmh: Math.round(current.wind_speed_10m ?? 12),
              visibilityKm: decoded.gripRisk === 'high' ? 5.0 : 10.0,
              roadGripRisk: decoded.gripRisk,
            };
          });

          const overallCondition = maxRain > 50 ? 'Rain Showers Expected Ahead' : maxRain > 20 ? 'Isolated Passing Clouds' : 'Optimal Dry Touring Conditions';
          const advisory = maxRain > 50
            ? 'Reduced tyre friction on ghat hairpins; expect wet asphalt sectors.'
            : 'Favorable tarmac temperatures and optimal visibility across highway segments.';

          return {
            checkpoints,
            maxRainProbability: maxRain,
            overallCondition,
            advisory,
            provenance: {
              source: 'Open-Meteo API',
              sourceUrl: 'https://open-meteo.com',
              timestamp: new Date().toISOString(),
              freshness: 'recent',
              confidence: 0.95,
              isDemoData: false,
            },
          };
        } catch (error) {
          console.warn('[OpenMeteoWeatherAdapter] Fetch failed or timed out:', error instanceof Error ? error.message : error);
          return fallbackWeatherAdapter.getWeatherForCheckpoints(list);
        }
      }
    );
  }
}

export const openMeteoWeatherAdapter = new OpenMeteoWeatherAdapter();
