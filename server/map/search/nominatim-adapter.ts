import { Coordinates } from '../routing/routing.interface';
import {
  IReverseGeocodeProvider,
  ISearchProvider,
  NormalizedPlace,
  SearchOptions,
} from './search.interface';
import { fallbackSearchAdapter } from './fallback-search';
import { globalMemoryCache } from '../cache/memory-cache';
import { providerLimiters } from '../rate-limit/token-bucket';

interface NominatimSearchResult {
  place_id: number;
  osm_id: number;
  osm_type: string;
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance?: number;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  boundingbox?: string[];
  geojson?: any;
}

export class NominatimSearchAdapter implements ISearchProvider, IReverseGeocodeProvider {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(
    baseUrl = 'https://nominatim.openstreetmap.org',
    timeoutMs = 4500
  ) {
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  async search(options: SearchOptions): Promise<NormalizedPlace[]> {
    const q = options.query.trim();
    if (!q) return [];

    const cacheKey = `search:nominatim:${q.toLowerCase()}:${options.limit || 5}`;

    return globalMemoryCache.fetchOrDedupe<NormalizedPlace[]>(
      cacheKey,
      86400 * 1000, // 24 hours TTL
      async () => {
        // Enforce Nominatim 1 req/sec usage policy
        const allowed = await providerLimiters.nominatim.acquire(1, 2500);
        if (!allowed) {
          console.warn('[NominatimSearchAdapter] Rate limit exceeded, using fallback search');
          return fallbackSearchAdapter.search(options);
        }

        const params = new URLSearchParams({
          q,
          format: 'jsonv2',
          addressdetails: '1',
          polygon_geojson: '1',
          limit: String(options.limit || 5),
          countrycodes: 'in', // Bias towards India
        });

        if (options.viewbox) {
          params.set('viewbox', options.viewbox.join(','));
          params.set('bounded', '0');
        }

        const url = `${this.baseUrl}/search?${params.toString()}`;

        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), this.timeoutMs);

          const response = await fetch(url, {
            headers: {
              'User-Agent': 'MotoCompanion-Navigation-Platform/1.0 (contact: support@motocompanion.app)',
              Accept: 'application/json',
            },
            signal: controller.signal,
          });

          clearTimeout(timer);

          if (!response.ok) {
            console.warn(`[NominatimSearchAdapter] HTTP ${response.status} from Nominatim, using fallback search`);
            return fallbackSearchAdapter.search(options);
          }

          const rawList: NominatimSearchResult[] = await response.json();
          if (!Array.isArray(rawList) || rawList.length === 0) {
            return fallbackSearchAdapter.search(options);
          }

          return rawList.map((item) => {
            const lon = parseFloat(item.lon);
            const lat = parseFloat(item.lat);
            const shortName = item.display_name.split(',')[0].trim();
            const locality = item.address?.city || item.address?.town || item.address?.state || '';
            const hasGeojsonPolygon =
              item.geojson &&
              (item.geojson.type === 'Polygon' || item.geojson.type === 'MultiPolygon') &&
              Array.isArray(item.geojson.coordinates) &&
              item.geojson.coordinates.length > 0;

            return {
              id: `nom-${item.place_id}`,
              name: shortName,
              displayName: item.display_name,
              category: item.class,
              type: item.type,
              coordinates: [lon, lat],
              locality,
              address: item.address,
              importance: item.importance,
              boundingBox: item.boundingbox
                ? [
                    parseFloat(item.boundingbox[0]),
                    parseFloat(item.boundingbox[1]),
                    parseFloat(item.boundingbox[2]),
                    parseFloat(item.boundingbox[3]),
                  ]
                : undefined,
              boundaryGeojson: hasGeojsonPolygon ? item.geojson : undefined,
              isAdministrativeBoundary: !!hasGeojsonPolygon,
              provenance: {
                source: 'OpenStreetMap / Nominatim',
                sourceUrl: 'https://nominatim.openstreetmap.org',
                timestamp: new Date().toISOString(),
                freshness: 'recent',
                confidence: 0.95,
                isDemoData: false,
              },
            };
          });
        } catch (error) {
          console.warn('[NominatimSearchAdapter] Fetch failed or timed out:', error instanceof Error ? error.message : error);
          return fallbackSearchAdapter.search(options);
        }
      }
    );
  }

  async reverseGeocode(coordinates: Coordinates): Promise<NormalizedPlace | null> {
    const [lon, lat] = coordinates;
    const cacheKey = `rev:nominatim:${lon.toFixed(4)},${lat.toFixed(4)}`;

    return globalMemoryCache.fetchOrDedupe<NormalizedPlace | null>(
      cacheKey,
      86400 * 1000, // 24 hours TTL
      async () => {
        const allowed = await providerLimiters.nominatim.acquire(1, 2500);
        if (!allowed) {
          return fallbackSearchAdapter.reverseGeocode(coordinates);
        }

        const url = `${this.baseUrl}/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`;

        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), this.timeoutMs);

          const response = await fetch(url, {
            headers: {
              'User-Agent': 'MotoCompanion-Navigation-Platform/1.0 (contact: support@motocompanion.app)',
              Accept: 'application/json',
            },
            signal: controller.signal,
          });

          clearTimeout(timer);

          if (!response.ok) {
            return fallbackSearchAdapter.reverseGeocode(coordinates);
          }

          const raw: NominatimSearchResult = await response.json();
          if (!raw || !raw.display_name) {
            return fallbackSearchAdapter.reverseGeocode(coordinates);
          }

          const shortName = raw.display_name.split(',')[0].trim();
          const locality = raw.address?.city || raw.address?.town || raw.address?.state || '';

          return {
            id: `nom-rev-${raw.place_id}`,
            name: shortName,
            displayName: raw.display_name,
            category: raw.class,
            type: raw.type,
            coordinates: [lon, lat],
            locality,
            address: raw.address,
            provenance: {
              source: 'OpenStreetMap / Nominatim',
              sourceUrl: 'https://nominatim.openstreetmap.org',
              timestamp: new Date().toISOString(),
              freshness: 'recent',
              confidence: 0.95,
              isDemoData: false,
            },
          };
        } catch (error) {
          return fallbackSearchAdapter.reverseGeocode(coordinates);
        }
      }
    );
  }
}

export const nominatimSearchAdapter = new NominatimSearchAdapter();
