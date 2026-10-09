import {
  IPOIProvider,
  POICategory,
  POISearchParams,
  RoutePOI,
} from './poi.interface';
import { fallbackPOIAdapter } from './fallback-pois';
import { globalMemoryCache } from '../cache/memory-cache';
import { providerLimiters } from '../rate-limit/token-bucket';

interface OverpassElement {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

export class OverpassPOIAdapter implements IPOIProvider {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(
    baseUrl = 'https://overpass-api.de/api/interpreter',
    timeoutMs = 6000
  ) {
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  async getPOIsInBBox(params: POISearchParams): Promise<RoutePOI[]> {
    const bbox = params.bbox || [75.7, 12.9, 77.6, 13.4]; // Bangalore-Chikmagalur default bbox [minLon, minLat, maxLon, maxLat]
    const cacheKey = `poi:overpass:${bbox.map((n) => n.toFixed(3)).join(',')}:${params.categories?.join(',') || 'all'}`;

    return globalMemoryCache.fetchOrDedupe<RoutePOI[]>(
      cacheKey,
      6 * 3600 * 1000, // 6 hours TTL
      async () => {
        // Enforce rate limiter
        const allowed = await providerLimiters.overpass.acquire(1, 2000);
        if (!allowed) {
          console.warn('[OverpassPOIAdapter] Rate limit exceeded, using fallback POIs');
          return fallbackPOIAdapter.getPOIsInBBox(params);
        }

        // Overpass QL uses [bbox:south,west,north,east]
        const [minLon, minLat, maxLon, maxLat] = bbox;
        const query = `
          [out:json][timeout:5];
          (
            node["amenity"="fuel"](${minLat},${minLon},${maxLat},${maxLon});
            node["shop"~"motorcycle|tyres"](${minLat},${minLon},${maxLat},${maxLon});
            node["amenity"~"restaurant|cafe"](${minLat},${minLon},${maxLat},${maxLon});
            node["tourism"~"hotel|guest_house"](${minLat},${minLon},${maxLat},${maxLon});
            node["amenity"~"hospital|clinic|pharmacy"](${minLat},${minLon},${maxLat},${maxLon});
            node["amenity"="atm"](${minLat},${minLon},${maxLat},${maxLon});
            node["amenity"="police"](${minLat},${minLon},${maxLat},${maxLon});
          );
          out body 25;
        `.trim();

        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), this.timeoutMs);

          const response = await fetch(this.baseUrl, {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'MotoCompanion-Navigation-Platform/1.0',
            },
            signal: controller.signal,
          });

          clearTimeout(timer);

          if (!response.ok) {
            console.warn(`[OverpassPOIAdapter] HTTP ${response.status} from Overpass, using fallback POIs`);
            return fallbackPOIAdapter.getPOIsInBBox(params);
          }

          const json = await response.json();
          const elements: OverpassElement[] = json.elements || [];

          if (!Array.isArray(elements) || elements.length === 0) {
            return fallbackPOIAdapter.getPOIsInBBox(params);
          }

          return elements.map((el) => {
            const tags = el.tags || {};
            let category: POICategory = 'food';
            if (tags.amenity === 'fuel') category = 'fuel';
            else if (tags.shop === 'motorcycle' || tags.shop === 'tyres') category = 'repair';
            else if (tags.tourism === 'hotel' || tags.tourism === 'guest_house') category = 'stay';
            else if (tags.amenity === 'hospital' || tags.amenity === 'clinic' || tags.amenity === 'pharmacy') category = 'medical';
            else if (tags.amenity === 'atm') category = 'atm';
            else if (tags.amenity === 'police') category = 'police';

            // Anti-assumption rule: extract only explicit factual capabilities from source tags
            const services: string[] = [];
            if (tags['service:motorcycle:repair'] === 'yes') services.push('Motorcycle Repair (OSM Tagged)');
            if (tags['service:motorcycle:tyres'] === 'yes') services.push('Tyre Service (OSM Tagged)');
            if (tags['fuel:diesel'] === 'yes') services.push('Diesel available');
            if (tags['fuel:octane_95'] === 'yes') services.push('95 Octane available');
            if (tags.emergency === 'yes') services.push('Emergency Unit (OSM Tagged)');

            return {
              id: `osm-poi-${el.id}`,
              name: tags.name || `${category.toUpperCase()} (OSM #${el.id})`,
              category,
              coordinates: [el.lon, el.lat],
              fuelGrade: category === 'fuel' ? 'FUEL TYPE NOT VERIFIED' : undefined,
              phone: tags['contact:phone'] || tags.phone,
              services: services.length > 0 ? services : undefined,
              address: tags['addr:street'] || tags['addr:city'],
              provenance: {
                source: 'OpenStreetMap / Overpass API',
                sourceUrl: 'https://www.openstreetmap.org',
                timestamp: new Date().toISOString(),
                freshness: 'recent',
                confidence: 0.95,
                isDemoData: false,
              },
            };
          });
        } catch (error) {
          console.warn('[OverpassPOIAdapter] Fetch failed or timed out:', error instanceof Error ? error.message : error);
          return fallbackPOIAdapter.getPOIsInBBox(params);
        }
      }
    );
  }
}

export const overpassPOIAdapter = new OverpassPOIAdapter();
