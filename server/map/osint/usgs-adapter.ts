import { IOSINTProvider, OSINTEvent } from './osint.interface';
import { globalMemoryCache } from '../cache/memory-cache';

interface USGSFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    title: string;
    url: string;
    alert?: string;
  };
  geometry: {
    type: string;
    coordinates: [number, number, number]; // [lon, lat, depth]
  };
}

export class USGSEarthquakeAdapter implements IOSINTProvider {
  private readonly feedUrl: string;
  private readonly timeoutMs: number;

  constructor(
    feedUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
    timeoutMs = 4500
  ) {
    this.feedUrl = feedUrl;
    this.timeoutMs = timeoutMs;
  }

  async getEvents(bbox?: [number, number, number, number]): Promise<OSINTEvent[]> {
    const cacheKey = 'osint:usgs:all_day';

    return globalMemoryCache.fetchOrDedupe<OSINTEvent[]>(
      cacheKey,
      15 * 60 * 1000, // 15 minutes TTL
      async () => {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), this.timeoutMs);

          const response = await fetch(this.feedUrl, {
            headers: {
              'User-Agent': 'MotoCompanion-Navigation-Platform/1.0',
              Accept: 'application/json',
            },
            signal: controller.signal,
          });

          clearTimeout(timer);

          if (!response.ok) {
            console.warn(`[USGSEarthquakeAdapter] HTTP ${response.status} from USGS, returning zero seismic events`);
            return [];
          }

          const geojson = await response.json();
          const features: USGSFeature[] = geojson.features || [];

          // Filter by bounding box if provided (e.g., India subcontinent ~ [68, 6, 97, 37])
          const [minLon, minLat, maxLon, maxLat] = bbox || [68.0, 6.0, 97.0, 37.0];

          const filtered = features.filter((f) => {
            const [lon, lat] = f.geometry.coordinates;
            return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
          });

          if (filtered.length === 0) {
            // Honest reporting: 0 active earthquakes detected in corridor/region. Do NOT inject fake road hazards.
            return [];
          }

          return filtered.map((f) => {
            const mag = f.properties.mag || 0;
            const severity = mag >= 5.0 ? 'critical' : mag >= 4.0 ? 'high' : 'moderate';

            return {
              id: `usgs-${f.id}`,
              category: 'seismic',
              title: f.properties.title || `M${mag} Earthquake`,
              description: `Seismic activity registered at ${f.properties.place}. Depth: ${f.geometry.coordinates[2]}km.`,
              severity,
              coordinates: [f.geometry.coordinates[0], f.geometry.coordinates[1]],
              magnitude: mag,
              confidence: 0.98,
              provenance: {
                source: 'USGS Real-Time Earthquake Feed',
                sourceUrl: f.properties.url || 'https://earthquake.usgs.gov',
                timestamp: new Date(f.properties.time).toISOString(),
                freshness: 'recent',
                confidence: 0.98,
                isDemoData: false,
              },
            };
          });
        } catch (error) {
          console.warn('[USGSEarthquakeAdapter] Fetch failed or timed out:', error instanceof Error ? error.message : error);
          // Do NOT mislabel road demo hazards as earthquakes on network timeout
          return [];
        }
      }
    );
  }

  getStatus(): { provider: string; isOnline: boolean } {
    return {
      provider: 'USGS Real-Time Earthquake Feed',
      isOnline: true,
    };
  }
}

export const usgsEarthquakeAdapter = new USGSEarthquakeAdapter();
